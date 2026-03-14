import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import { LlmProvider } from './llm-provider.interface';
import { InternalServerErrorException } from '@nestjs/common';

export class GeminiProvider implements LlmProvider {
    readonly name = 'gemini';

    async generateTemplate(prompt: string, currentElements: any[], modelName?: string, config?: any): Promise<any[]> {
        const apiKey = config?.apiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new InternalServerErrorException('Gemini API Key is not configured.');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: modelName || config?.modelName || process.env.GEMINI_DEFAULT_MODEL || 'gemini-1.5-flash',
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
            console.log('GeminiProvider: Sending prompt...');
            const result = await model.generateContent(systemPrompt);
            const outputText = result.response.text().trim();

            let cleanedText = outputText.replace(/^```(json)?\s*/i, '').replace(/\s*```$/i, '').trim();

            if (!cleanedText.startsWith('[')) {
                const match = cleanedText.match(/\[.*\]/s);
                if (match) cleanedText = match[0];
            }

            let newElements = JSON.parse(cleanedText);

            return newElements.map((el: any) => ({
                ...el,
                id: el.id || uuidv4(),
                pageIndex: el.pageIndex ?? 0,
            }));
        } catch (error) {
            console.error('GeminiProvider Error Details:', error.message || error);
            const errorMessage = error.message?.includes('API_KEY_INVALID')
                ? 'Invalid Gemini API Key.'
                : (error.message || 'Unknown Gemini error');
            throw new InternalServerErrorException(`Gemini Error: ${errorMessage}`);
        }
    }
}
