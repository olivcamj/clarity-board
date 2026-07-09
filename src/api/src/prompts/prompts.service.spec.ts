import { Test, TestingModule } from '@nestjs/testing';
import { PromptsService } from './prompts.service';
import { CreatePromptDto } from './dto/create-prompt.dto';

describe('PromptsService', () => {
  let service: PromptsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptsService],
    }).compile();

    service = module.get<PromptsService>(PromptsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an empty array initially', () => {
      expect(service.findAll()).toEqual([]);
    });

    it('should return all stored prompts', () => {
      const prompt: CreatePromptDto = { title: 'Test', body: 'Hello world' };
      service.create(prompt);

      expect(service.findAll()).toHaveLength(1);
      expect(service.findAll()[0]).toEqual(prompt);
    });
  });

  describe('create', () => {
    it('should store the prompt and return it', () => {
      const prompt: CreatePromptDto = {
        title: 'My Prompt',
        body: 'Do something',
      };
      const result = service.create(prompt);

      expect(result).toEqual(prompt);
    });

    it('should accumulate multiple prompts', () => {
      service.create({ title: 'First', body: 'Body one' });
      service.create({ title: 'Second', body: 'Body two' });

      expect(service.findAll()).toHaveLength(2);
    });
  });
});
