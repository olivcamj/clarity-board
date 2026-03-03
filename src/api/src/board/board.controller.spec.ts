import { Test, TestingModule } from '@nestjs/testing';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

describe('BoardController', () => {
  let controller: BoardController;

  const mockBoard = {
    id: 'board-1',
    name: 'Sprint Board',
    teamId: 'team-1',
    teamName: 'Sample Team Name',
    taskCount: 0,
  };

  const mockBoardService = {
    create: jest.fn().mockResolvedValue(mockBoard),
    findAllByTeam: jest.fn().mockResolvedValue([mockBoard]),
    findOne: jest.fn().mockResolvedValue({ ...mockBoard, tasks: [] }),
    update: jest
      .fn()
      .mockResolvedValue({ ...mockBoard, name: 'Updated Board' }),
    remove: jest
      .fn()
      .mockResolvedValue({ message: 'Board deleted successfully' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardController],
      providers: [{ provide: BoardService, useValue: mockBoardService }],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BoardController>(BoardController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call boardService.create and return the result', async () => {
      const dto = { name: 'Sprint Board', teamId: 'team-1' };
      const result = await controller.create(dto);

      expect(result).toEqual(mockBoard);
      expect(mockBoardService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAllByTeam', () => {
    it('should call boardService.findAllByTeam and return boards', async () => {
      const result = await controller.findAllByTeam('team-1');

      expect(result).toEqual([mockBoard]);
      expect(mockBoardService.findAllByTeam).toHaveBeenCalledWith('team-1');
    });
  });

  describe('findOne', () => {
    it('should call boardService.findOne and return a board with tasks', async () => {
      const result = await controller.findOne('board-1');

      expect(result.id).toBe('board-1');
      expect(mockBoardService.findOne).toHaveBeenCalledWith('board-1');
    });
  });

  describe('update', () => {
    it('should call boardService.update and return the updated board', async () => {
      const dto = { name: 'Updated Board' };
      const result = await controller.update('board-1', dto);

      expect(result.name).toBe('Updated Board');
      expect(mockBoardService.update).toHaveBeenCalledWith('board-1', dto);
    });
  });

  describe('remove', () => {
    it('should call boardService.remove and return success message', async () => {
      const result = await controller.remove('board-1');

      expect(result).toEqual({ message: 'Board deleted successfully' });
      expect(mockBoardService.remove).toHaveBeenCalledWith('board-1');
    });
  });
});
