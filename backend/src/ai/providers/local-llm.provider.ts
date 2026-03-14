import { LlmProvider } from './llm-provider.interface';
import { v4 as uuidv4 } from 'uuid';
import { InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

export class LocalLlmProvider implements LlmProvider {
    readonly name = 'local';

    async generateTemplate(prompt: string, currentElements: any[], modelName?: string, config?: any): Promise<any[]> {
        const url = config?.baseUrl || process.env.LOCAL_LLM_URL || 'http://localhost:11434/api/generate';
        const model = modelName || config?.modelName || process.env.LOCAL_LLM_DEFAULT_MODEL || 'llama3';

        const systemPrompt = `
      You are an expert PDF Template AI Assistant. 
      The Canvas is an A4 page (width: 595.28, height: 841.89).
      Respond ONLY with a valid JSON array of element objects.
      
      Current Elements: ${JSON.stringify(currentElements)}
      
      User Prompt: "${prompt}"
      
      Output exactly a JSON array, nothing else.`;

        try {
            console.log(`LocalLlmProvider: Sending request to ${url} (${model})...`);

            // Supporting Ollama's /api/generate format by default
            const response = await axios.post(url, {
                model: model,
                prompt: systemPrompt,
                stream: false,
                format: 'json'
            });

            let content = '';
            if (response.data.response) {
                content = response.data.response.trim();
            } else if (response.data.choices) {
                // OpenAI compatible local API
                content = response.data.choices[0].message.content.trim();
            }

            let parsed = JSON.parse(content);
            let elements = Array.isArray(parsed) ? parsed : (parsed.elements || parsed.items || []);

            return elements.map((el: any) => ({
                ...el,
                id: el.id || uuidv4(),
                pageIndex: el.pageIndex ?? 0,
            }));
        } catch (error) {
            console.error('LocalLlmProvider Error:', error.message);
            throw new InternalServerErrorException('Failed to process AI request via Local LLM (e.g., Ollama). Ensure the service is running.');
        }
    }
}
