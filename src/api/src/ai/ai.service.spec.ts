import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';

const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
  Type: { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING' },
}));

describe('AiService', () => {
  let service: AiService;

  const mockBoard = {
    name: 'Sprint Board',
    tasks: [{ title: 'Existing task' }],
  };

  const mockPrismaService = {
    user: {
      updateMany: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    board: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockPrismaService.user.updateMany.mockResolvedValue({ count: 1 });
    mockPrismaService.user.findUnique.mockResolvedValue({
      aiGenerationCount: 1,
    });
    mockPrismaService.board.findUnique.mockResolvedValue(mockBoard);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  describe('generateTaskSuggestions', () => {
    it('returns sanitized suggestions on a valid Gemini response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          tasks: [
            {
              title: 'Write onboarding doc',
              description: 'Draft the v2 onboarding guide',
              priority: 'high',
              labels: ['design'],
            },
          ],
        }),
      });

      const result = await service.generateTaskSuggestions(
        'board-1',
        'plan onboarding',
        'user-1',
      );

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].title).toBe('Write onboarding doc');
      expect(result.usage).toEqual({ used: 1, limit: 3, remaining: 2 });
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: { id: 'user-1', aiGenerationCount: { lt: 3 } },
        data: { aiGenerationCount: { increment: 1 } },
      });
    });

    it('drops malformed/oversized items instead of failing the whole request', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          tasks: [
            {
              title: 'Valid task',
              description: 'ok',
              priority: 'med',
              labels: ['bug'],
            },
            {
              title: '',
              description: 'missing title',
              priority: 'med',
              labels: [],
            },
            {
              title: 'Bad priority',
              description: 'x',
              priority: 'urgent',
              labels: [],
            },
            {
              title: 'Bad label',
              description: 'x',
              priority: 'low',
              labels: ['not-a-real-label'],
            },
          ],
        }),
      });

      const result = await service.generateTaskSuggestions(
        'board-1',
        'plan something',
        'user-1',
      );

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].title).toBe('Valid task');
    });

    it('throws 429 and never calls Gemini once the user has hit the limit', async () => {
      mockPrismaService.user.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.generateTaskSuggestions('board-1', 'plan something', 'user-1'),
      ).rejects.toThrow(HttpException);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('refunds the call if the board is not found', async () => {
      mockPrismaService.board.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.generateTaskSuggestions(
          'missing-board',
          'plan something',
          'user-1',
        ),
      ).rejects.toThrow('Board missing-board not found');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { aiGenerationCount: { decrement: 1 } },
      });
    });

    it('refunds the call and throws BadGatewayException if Gemini errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('network blip'));

      await expect(
        service.generateTaskSuggestions('board-1', 'plan something', 'user-1'),
      ).rejects.toThrow('Failed to generate task suggestions');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { aiGenerationCount: { decrement: 1 } },
      });
    });
  });

  describe('getUsage', () => {
    it('returns used/limit/remaining', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        aiGenerationCount: 2,
      });
      const usage = await service.getUsage('user-1');
      expect(usage).toEqual({ used: 2, limit: 3, remaining: 1 });
    });
  });
});
