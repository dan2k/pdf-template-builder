import { LlmProvider } from './llm-provider.interface';
import { v4 as uuidv4 } from 'uuid';
import { InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

export class AnthropicProvider implements LlmProvider {
    readonly name = 'anthropic';

    async generateTemplate(prompt: string, currentElements: any[], modelName?: string, config?: any): Promise<any[]> {
        const apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new InternalServerErrorException('ANTHROPIC_API_KEY is not configured.');
        }

        const model = modelName || config?.modelName || process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-5-sonnet-20241022';

        const systemPrompt = `
      You are an expert PDF Template AI Assistant. 
      The Canvas is an A4 page (width: 595.28, height: 841.89).
      Respond ONLY with a valid JSON array of element objects.
      
      Current Elements: ${JSON.stringify(currentElements)}`;

        try {
            console.log(`AnthropicProvider: Sending request to Anthropic (${model})...`);

            const response = await axios.post(
                'https://api.anthropic.com/v1/messages',
                {
                    model: model,
                    max_tokens: 4096,
                    system: systemPrompt,
                    messages: [
                        { role: 'user', content: prompt }
                    ]
                },
                {
                    headers: {
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'Content-Type': 'application/json'
                    }
                }
            );

            let content = response.data.content[0].text.trim();

            // Handle Claude's potential markdown wrapping
            let cleanedText = content.replace(/^```(json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            if (!cleanedText.startsWith('[')) {
                const match = cleanedText.match(/\[.*\]/s);
                if (match) cleanedText = match[0];
            }

            let parsed = JSON.parse(cleanedText);
            let elements = Array.isArray(parsed) ? parsed : (parsed.elements || parsed.items || []);

            return elements.map((el: any) => ({
                ...el,
                id: el.id || uuidv4(),
                pageIndex: el.pageIndex ?? 0,
            }));
        } catch (error) {
            console.error('AnthropicProvider Error:', error.response?.data || error.message);
            throw new InternalServerErrorException('Failed to process AI request via Anthropic (Claude).');
        }
    }
}
