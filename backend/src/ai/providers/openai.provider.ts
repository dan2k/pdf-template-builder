import { LlmProvider } from './llm-provider.interface';
import { v4 as uuidv4 } from 'uuid';
import { InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

export class OpenAiProvider implements LlmProvider {
    readonly name = 'openai';

    async generateTemplate(prompt: string, currentElements: any[], modelName?: string, config?: any): Promise<any[]> {
        const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;
        const baseUrl = config?.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

        if (!apiKey && !baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1')) {
            throw new InternalServerErrorException('OPENAI_API_KEY is not configured.');
        }

        const model = modelName || config?.modelName || process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';

        const systemPrompt = `
      You are an expert PDF Template AI Assistant. 
      The Canvas is an A4 page (width: 595.28, height: 841.89).
      Respond ONLY with a valid JSON array of UI elements.
      
      Element Rules:
      - id (UUID), type, x, y, width, height, pageIndex (0).
      - text: content, fontSize, fontFamily, color, align.
      - shape: shape ('rectangle'|'circle'|'line'), fillColor, strokeColor, strokeWidth.
      - table: columns ({key, label, width}), dataKey, etc.
      
      Current Elements: ${JSON.stringify(currentElements)}`;

        try {
            console.log(`OpenAiProvider: Sending request to ${baseUrl} (${model})...`);
            const response = await axios.post(
                `${baseUrl}/chat/completions`,
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
                        'Content-Type': 'application/json'
                    }
                }
            );

            let content = response.data.choices[0].message.content.trim();
            let parsed = JSON.parse(content);
            let elements = Array.isArray(parsed) ? parsed : (parsed.elements || parsed.items || []);

            return elements.map((el: any) => ({
                ...el,
                id: el.id || uuidv4(),
                pageIndex: el.pageIndex ?? 0,
            }));
        } catch (error) {
            console.error('OpenAiProvider Error:', error.response?.data || error.message);
            throw new InternalServerErrorException('Failed to process AI request via OpenAI/Compatible API.');
        }
    }
}
