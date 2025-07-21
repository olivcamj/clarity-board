import { Controller, Get, Post, Body } from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { CreatePromptDto } from './dto/create-prompt.dto';

@Controller('prompts')
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Get()
  findAll() {
    return this.promptsService.findAll();
  }

  @Post()
  create(@Body() createPromptDto: CreatePromptDto) {
    return this.promptsService.create(createPromptDto);
  }
}
