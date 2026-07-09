import { Test, TestingModule } from '@nestjs/testing';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';
import { CreatePromptDto } from './dto/create-prompt.dto';

describe('PromptsController', () => {
  let controller: PromptsController;

  const mockPrompt: CreatePromptDto = {
    title: 'Sprint Retro',
    body: 'What went well?',
  };

  const mockPromptsService = {
    findAll: jest.fn().mockReturnValue([mockPrompt]),
    create: jest.fn().mockReturnValue(mockPrompt),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromptsController],
      providers: [{ provide: PromptsService, useValue: mockPromptsService }],
    }).compile();

    controller = module.get<PromptsController>(PromptsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call promptsService.findAll and return all prompts', () => {
      const result = controller.findAll();

      expect(result).toEqual([mockPrompt]);
      expect(mockPromptsService.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should call promptsService.create with the dto and return the prompt', () => {
      const dto: CreatePromptDto = {
        title: 'Sprint Retro',
        body: 'What went well?',
      };
      const result = controller.create(dto);

      expect(result).toEqual(mockPrompt);
      expect(mockPromptsService.create).toHaveBeenCalledWith(dto);
    });
  });
});
