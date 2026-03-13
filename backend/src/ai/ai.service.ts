import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('GEMINI_API_KEY is not set in environment variables.');
        } else {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    async transformTemplate(prompt: string, currentElements: any[]): Promise<any[]> {
        if (!this.genAI) {
            throw new InternalServerErrorException('GEMINI_API_KEY is not configured on the server.');
        }

        const model = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const systemPrompt = `
      You are an expert PDF Template AI Assistant. Your job is to transform or generate a JSON array of UI elements based on the User's Prompt and the Current Elements on the canvas.
      
      The Canvas is an A4 page (width: 595.28, height: 841.89).
      
      You must respond ONLY with a valid JSON array of objects representing the final elements on the page. Do not include any markdown format like \`\`\`json.
      
      Rules for Element Objects:
      - Each element must have: id (UUID), type, x, y, width, height, pageIndex (usually 0).
      - "text" type: content, fontSize, fontFamily, color, align.
      - "shape" type: shape ('rectangle'|'circle'|'line'), fillColor, strokeColor, strokeWidth.
      - "table" type: columns (array of {key, label, width percentage}), dataKey, headerBgColor, headerTextColor, borderColor, borderWidth, fontSize, cellPadding, repeatHeaderOnNewPage (boolean).
      - Ensure positions and dimensions fit within the A4 canvas.
      - If the user asks to modify an existing element, update its properties in the array.
      - If the user asks to add a new element, generate a new one with a random UUID and append it to the array.
      - If the user asks to delete, omit it from the array.
      - Keep intact any elements the user did NOT ask to change.
      
      Current Elements JSON:
      ${JSON.stringify(currentElements)}
      
      User Prompt: 
      "${prompt}"
      
      Output exactly a JSON array, nothing else.`;

        try {
            console.log('Sending prompt to Gemini...');
            const result = await model.generateContent(systemPrompt);
            const outputText = result.response.text().trim();
            console.log('Raw AI output:', outputText);

            let cleanedText = outputText.replace(/^```(json)?\s*/i, '').replace(/\s*```$/i, '').trim();

            // Fallback: If AI still included extra text, try to extract the JSON array using regex
            if (!cleanedText.startsWith('[')) {
                const match = cleanedText.match(/\[.*\]/s);
                if (match) {
                    cleanedText = match[0];
                    console.log('Extracted JSON array from text:', cleanedText);
                }
            }

            let newElements = JSON.parse(cleanedText);

            // Ensure IDs are present
            newElements = newElements.map((el: any) => ({
                ...el,
                id: el.id || uuidv4(),
                pageIndex: el.pageIndex ?? 0,
            }));

            return newElements;
        } catch (error) {
            console.error('AI Transform Error:', error);
            throw new InternalServerErrorException('Failed to process AI request. The output might not have been valid JSON.');
        }
    }
}
