// openai.service.ts
import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';

@Injectable()
export class OpenAIService {
    public OpenAI:OpenAI
    constructor() {
        const OpenAIObject: OpenAI = new OpenAI({
            baseURL: 'https://api.moonshot.cn/v1',
            apiKey: 'sk-xtdRuGRY0pKL5rGlcNEZpSf4fWvTpe2GFLIk1fncxtBCB1ak',
        })
        this.OpenAI = OpenAIObject
    }

  // Your methods to interact with OpenAI
}
