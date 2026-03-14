export interface LlmProvider {
    readonly name: string;
    generateTemplate(prompt: string, currentElements: any[], model?: string, config?: any): Promise<any[]>;
}
