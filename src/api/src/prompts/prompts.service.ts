import { Injectable } from '@nestjs/common';
import { CreatePromptDto } from './dto/create-prompt.dto';

@Injectable()
export class PromptsService {
  private prompts: CreatePromptDto[] = [];

  findAll() {
    return this.prompts;
  }

  create(prompt: CreatePromptDto) {
    this.prompts.push(prompt);
    return prompt;
  }
}
