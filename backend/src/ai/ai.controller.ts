import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('transform')
    @HttpCode(HttpStatus.OK)
    async transformTemplate(
        @Body('prompt') prompt: string,
        @Body('elements') elements: any[] = [],
    ) {
        const result = await this.aiService.transformTemplate(prompt, elements);
        return { success: true, elements: result };
    }
}
