import { LlmProvider } from './llm-provider.interface';
import { v4 as uuidv4 } from 'uuid';
import { InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

export class OpenRouterProvider implements LlmProvider {
    readonly name = 'openrouter';

    async generateTemplate(prompt: string, currentElements: any[], modelName?: string, config?: any): Promise<any[]> {
        const apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new InternalServerErrorException('OPENROUTER_API_KEY is not configured.');
        }

        const model = modelName || config?.modelName || process.env.OPENROUTER_DEFAULT_MODEL || 'google/gemini-2.0-flash-001';

        const systemPrompt = `
      You are an expert PDF Template AI Assistant. 
      The Canvas is an A4 page (width: 595.28, height: 841.89).
      Respond ONLY with a valid JSON array of element objects. No markdown.
      
      Element Rules:
      - id (UUID), type, x, y, width, height, pageIndex (0).
      - text: content, fontSize, fontFamily, color, align.
      - shape: shape ('rectangle'|'circle'|'line'), fillColor, strokeColor, strokeWidth.
      - table: columns ({key, label, width}), dataKey, headerBgColor, headerTextColor, etc.
      
      Current Elements: ${JSON.stringify(currentElements)}`;

        try {
            console.log(`OpenRouterProvider: Sending request to OpenRouter (${model})...`);
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: 'json_object' }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'https://github.com/dan2k/pdf-template-builder',
                        'X-Title': 'PDF Template Builder',
                        'Content-Type': 'application/json'
                    }
                }
            );

            let content = response.data.choices[0].message.content.trim();
            console.log('OpenRouter raw output:', content);

            // OpenRouter might return { "elements": [...] } if forced to object mode
            let parsed = JSON.parse(content);
            let elements = Array.isArray(parsed) ? parsed : (parsed.elements || parsed.items || []);

            return elements.map((el: any) => ({
                ...el,
                id: el.id || uuidv4(),
                pageIndex: el.pageIndex ?? 0,
            }));
        } catch (error) {
            console.error('OpenRouterProvider Error:', error.response?.data || error.message);
            throw new InternalServerErrorException('Failed to process AI request via OpenRouter.');
        }
    }
}
