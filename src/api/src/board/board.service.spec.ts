import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from './board.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('BoardService', () => {
  let service: BoardService;

  const mockTeam = { id: 'team-1', name: 'Sample Team Name' };

  const mockBoard = {
    id: 'board-1',
    name: 'Sprint Board',
    teamId: 'team-1',
    team: { name: 'Sample Team Name' },
    _count: { tasks: 2 },
  };

  const mockBoardWithTasks = {
    id: 'board-1',
    name: 'Sprint Board',
    teamId: 'team-1',
    team: { name: 'Sample Team Name' },
    tasks: [
      // status is lowercase in TaskResponseDto; assignees replaces old assignedTo FK
      { id: 'task-1', title: 'Fix bug', status: 'todo', assignees: [] },
    ],
  };

  const mockPrismaService = {
    team: {
      findUnique: jest.fn().mockResolvedValue(mockTeam),
    },
    board: {
      create: jest.fn().mockResolvedValue(mockBoard),
      findMany: jest.fn().mockResolvedValue([mockBoard]),
      findUnique: jest.fn().mockResolvedValue(mockBoard),
      update: jest
        .fn()
        .mockResolvedValue({ ...mockBoard, name: 'Updated Board' }),
      delete: jest.fn().mockResolvedValue(mockBoard),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BoardService>(BoardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a board and return a BoardResponseDto', async () => {
      const dto = { name: 'Sprint Board', teamId: 'team-1' };
      const result = await service.create(dto);

      expect(result.id).toBe('board-1');
      expect(result.name).toBe('Sprint Board');
      expect(result.teamId).toBe('team-1');
      expect(result.teamName).toBe('Sample Team Name');
      expect(result.taskCount).toBe(2);
      expect(mockPrismaService.team.findUnique).toHaveBeenCalledWith({
        where: { id: 'team-1' },
      });
      expect(mockPrismaService.board.create).toHaveBeenCalledWith({
        data: { name: 'Sprint Board', teamId: 'team-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if team does not exist', async () => {
      mockPrismaService.team.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.create({ name: 'Board', teamId: 'bad-team' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByTeam', () => {
    it('should return all boards for a team', async () => {
      const results = await service.findAllByTeam('team-1');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('board-1');
      expect(results[0].taskCount).toBe(2);
      expect(mockPrismaService.board.findMany).toHaveBeenCalledWith({
        where: { teamId: 'team-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if team does not exist', async () => {
      mockPrismaService.team.findUnique.mockResolvedValueOnce(null);
      await expect(service.findAllByTeam('bad-team')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a board with tasks (includeRelations = true)', async () => {
      mockPrismaService.board.findUnique.mockResolvedValueOnce(
        mockBoardWithTasks,
      );

      const result = await service.findOne('board-1');

      expect(result.id).toBe('board-1');
      expect(result.tasks).toBeDefined();
      expect(result.tasks).toHaveLength(1);
      expect(result.taskCount).toBeUndefined();
    });

    it('should throw NotFoundException if board does not exist', async () => {
      mockPrismaService.board.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the board', async () => {
      const result = await service.update('board-1', { name: 'Updated Board' });

      expect(result.name).toBe('Updated Board');
      expect(mockPrismaService.board.update).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        data: { name: 'Updated Board' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if board does not exist', async () => {
      mockPrismaService.board.findUnique.mockResolvedValueOnce(null);
      await expect(service.update('bad-id', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete the board and return a success message', async () => {
      const result = await service.remove('board-1');

      expect(result).toEqual({ message: 'Board deleted successfully' });
      expect(mockPrismaService.board.delete).toHaveBeenCalledWith({
        where: { id: 'board-1' },
      });
    });

    it('should throw NotFoundException if board does not exist', async () => {
      mockPrismaService.board.findUnique.mockResolvedValueOnce(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should delete a board that still has tasks (cascade handled by the DB)', async () => {
      mockPrismaService.board.findUnique.mockResolvedValueOnce(mockBoardWithTasks);

      const result = await service.remove('board-1');

      expect(result).toEqual({ message: 'Board deleted successfully' });
      expect(mockPrismaService.board.delete).toHaveBeenCalledWith({
        where: { id: 'board-1' },
      });
    });
  });
});
