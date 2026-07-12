import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TaskStatus, Priority } from '../../generated/client';

describe('TaskService', () => {
  let service: TaskService;

  const mockBoard = { id: 'board-1', name: 'Sprint Board' };

  // Shape matches what Prisma returns with taskIncludes — dates are Date objects,
  // status/priority are the real enum values so TaskResponseDto.fromPrisma works.
  const mockPrismaTask = {
    id: 'task-1',
    boardId: 'board-1',
    title: 'Fix bug',
    description: 'A serious bug',
    status: TaskStatus.TODO,
    priority: Priority.MED,
    labels: ['bug'],
    due: null,
    sprint: 'Sprint 1',
    position: 0,
    aiGenerated: false,
    source: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    createdBy: { id: 'user-1', name: 'Alice' },
    assignees: [],
    subtasks: [],
    comments: [],
    attachments: [],
  };

  const mockSubtask = {
    id: 'subtask-1',
    taskId: 'task-1',
    text: 'Write tests',
    done: false,
    position: 0,
  };

  const mockComment = {
    id: 'comment-1',
    taskId: 'task-1',
    text: 'Looks good',
    isAI: false,
    authorId: 'user-1',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockPrismaService = {
    board: {
      findUnique: jest.fn().mockResolvedValue(mockBoard),
    },
    task: {
      findMany: jest.fn().mockResolvedValue([mockPrismaTask]),
      aggregate: jest.fn().mockResolvedValue({ _max: { position: 0 } }),
      create: jest.fn().mockResolvedValue(mockPrismaTask),
      findUnique: jest.fn().mockResolvedValue(mockPrismaTask),
      update: jest.fn().mockResolvedValue(mockPrismaTask),
      delete: jest.fn().mockResolvedValue(mockPrismaTask),
    },
    subtask: {
      aggregate: jest.fn().mockResolvedValue({ _max: { position: 0 } }),
      create: jest.fn().mockResolvedValue(mockSubtask),
      findUnique: jest.fn().mockResolvedValue(mockSubtask),
      update: jest.fn().mockResolvedValue(mockSubtask),
      delete: jest.fn().mockResolvedValue(mockSubtask),
    },
    taskComment: {
      create: jest.fn().mockResolvedValue(mockComment),
      findUnique: jest.fn().mockResolvedValue(mockComment),
      update: jest.fn().mockResolvedValue(mockComment),
      delete: jest.fn().mockResolvedValue(mockComment),
    },
  };

  const mockRealtimeGateway = {
    broadcastTaskCreated: jest.fn(),
    broadcastTaskUpdated: jest.fn(),
    broadcastTaskDeleted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RealtimeGateway, useValue: mockRealtimeGateway },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByBoard', () => {
    it('should return all tasks for a board as TaskResponseDtos', async () => {
      const results = await service.findAllByBoard('board-1');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('task-1');
      expect(results[0].status).toBe('todo'); // enum → lowercase via fromPrisma
      expect(results[0].priority).toBe('med');
      expect(mockPrismaService.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
      });
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: { boardId: 'board-1' },
        orderBy: { position: 'asc' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if board does not exist', async () => {
      mockPrismaService.board.findUnique.mockResolvedValueOnce(null);

      await expect(service.findAllByBoard('bad-board')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a task with default status/priority and return a TaskResponseDto', async () => {
      const dto = { title: 'Fix bug' };
      const result = await service.create('board-1', dto as any, 'user-1');

      expect(result.id).toBe('task-1');
      expect(result.title).toBe('Fix bug');
      expect(result.status).toBe('todo');
      expect(result.priority).toBe('med');
      expect(mockPrismaService.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
      });
      expect(mockPrismaService.task.aggregate).toHaveBeenCalledWith({
        where: { boardId: 'board-1' },
        _max: { position: true },
      });
      expect(mockPrismaService.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            boardId: 'board-1',
            title: 'Fix bug',
            createdById: 'user-1',
          }),
        }),
      );
      expect(mockRealtimeGateway.broadcastTaskCreated).toHaveBeenCalledWith(
        'board-1',
        expect.objectContaining({ id: 'task-1' }),
      );
    });

    it('should auto-increment position from aggregate result', async () => {
      // max position is 4 → new task gets position 5
      mockPrismaService.task.aggregate.mockResolvedValueOnce({
        _max: { position: 4 },
      });
      const dto = { title: 'New task' };
      await service.create('board-1', dto as any, 'user-1');

      expect(mockPrismaService.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ position: 5 }),
        }),
      );
    });

    it('should use position 0 when the board has no tasks yet', async () => {
      mockPrismaService.task.aggregate.mockResolvedValueOnce({
        _max: { position: null },
      });
      const dto = { title: 'First task' };
      await service.create('board-1', dto as any, 'user-1');

      expect(mockPrismaService.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ position: 0 }),
        }),
      );
    });

    it('should connect assignees when assigneeIds are provided', async () => {
      const dto = {
        title: 'Task with assignees',
        assigneeIds: ['user-2', 'user-3'],
      };
      await service.create('board-1', dto as any, 'user-1');

      expect(mockPrismaService.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assignees: {
              connect: [{ id: 'user-2' }, { id: 'user-3' }],
            },
          }),
        }),
      );
    });

    it('should throw NotFoundException if board does not exist', async () => {
      mockPrismaService.board.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create('bad-board', { title: 'Task' } as any, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a task as a TaskResponseDto', async () => {
      const result = await service.findOne('task-1');

      expect(result.id).toBe('task-1');
      expect(result.boardId).toBe('board-1');
      expect(mockPrismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockPrismaService.task.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the task', async () => {
      const updatedTask = { ...mockPrismaTask, title: 'Updated title' };
      mockPrismaService.task.update.mockResolvedValueOnce(updatedTask);

      const result = await service.update('task-1', {
        title: 'Updated title',
      } as any);

      expect(result.title).toBe('Updated title');
      expect(mockPrismaService.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-1' },
          data: expect.objectContaining({ title: 'Updated title' }),
          include: expect.any(Object),
        }),
      );
      expect(mockRealtimeGateway.broadcastTaskUpdated).toHaveBeenCalledWith(
        'board-1',
        expect.objectContaining({ title: 'Updated title' }),
      );
    });

    it('should set assignees when assigneeIds is provided', async () => {
      mockPrismaService.task.update.mockResolvedValueOnce(mockPrismaTask);
      const dto = { assigneeIds: ['user-2'] };
      await service.update('task-1', dto as any);

      expect(mockPrismaService.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assignees: { set: [{ id: 'user-2' }] },
          }),
        }),
      );
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockPrismaService.task.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.update('bad-id', { title: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete the task and return a success message', async () => {
      const result = await service.remove('task-1');

      expect(result).toEqual({ message: 'Task deleted successfully' });
      expect(mockPrismaService.task.delete).toHaveBeenCalledWith({
        where: { id: 'task-1' },
      });
      expect(mockRealtimeGateway.broadcastTaskDeleted).toHaveBeenCalledWith(
        'board-1',
        { id: 'task-1' },
      );
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockPrismaService.task.findUnique.mockResolvedValueOnce(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.task.delete).not.toHaveBeenCalled();
      expect(mockRealtimeGateway.broadcastTaskDeleted).not.toHaveBeenCalled();
    });
  });

  describe('addSubtask', () => {
    it('should create a subtask and return the updated task', async () => {
      const dto = { text: 'Write tests' };
      const result = await service.addSubtask('task-1', dto as any);

      expect(result.id).toBe('task-1');
      expect(mockPrismaService.subtask.aggregate).toHaveBeenCalledWith({
        where: { taskId: 'task-1' },
        _max: { position: true },
      });
      expect(mockPrismaService.subtask.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          text: 'Write tests',
          done: false,
          position: 1,
        },
      });
      expect(mockRealtimeGateway.broadcastTaskUpdated).toHaveBeenCalledWith(
        'board-1',
        expect.objectContaining({ id: 'task-1' }),
      );
    });

    it('should use position 0 for the first subtask on a task', async () => {
      mockPrismaService.subtask.aggregate.mockResolvedValueOnce({
        _max: { position: null },
      });
      const dto = { text: 'First subtask' };
      await service.addSubtask('task-1', dto as any);

      expect(mockPrismaService.subtask.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ position: 0 }),
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockPrismaService.task.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.addSubtask('bad-id', { text: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSubtask', () => {
    it('should update a subtask and return the updated task', async () => {
      const dto = { done: true };
      const result = await service.updateSubtask(
        'task-1',
        'subtask-1',
        dto as any,
      );

      expect(result.id).toBe('task-1');
      expect(mockPrismaService.subtask.update).toHaveBeenCalledWith({
        where: { id: 'subtask-1' },
        data: { done: true },
      });
      expect(mockRealtimeGateway.broadcastTaskUpdated).toHaveBeenCalledWith(
        'board-1',
        expect.objectContaining({ id: 'task-1' }),
      );
    });

    it('should throw NotFoundException if subtask does not exist', async () => {
      mockPrismaService.subtask.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateSubtask('task-1', 'bad-subtask', { done: true } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if subtask belongs to a different task', async () => {
      mockPrismaService.subtask.findUnique.mockResolvedValueOnce({
        ...mockSubtask,
        taskId: 'other-task',
      });

      await expect(
        service.updateSubtask('task-1', 'subtask-1', { done: true } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeSubtask', () => {
    it('should delete a subtask and return the updated task', async () => {
      const result = await service.removeSubtask('task-1', 'subtask-1');

      expect(result.id).toBe('task-1');
      expect(mockPrismaService.subtask.delete).toHaveBeenCalledWith({
        where: { id: 'subtask-1' },
      });
      expect(mockRealtimeGateway.broadcastTaskUpdated).toHaveBeenCalledWith(
        'board-1',
        expect.objectContaining({ id: 'task-1' }),
      );
    });

    it('should throw NotFoundException if subtask does not exist', async () => {
      mockPrismaService.subtask.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.removeSubtask('task-1', 'bad-subtask'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if subtask belongs to a different task', async () => {
      mockPrismaService.subtask.findUnique.mockResolvedValueOnce({
        ...mockSubtask,
        taskId: 'other-task',
      });

      await expect(
        service.removeSubtask('task-1', 'subtask-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addComment', () => {
    it('should add a human comment and return the updated task', async () => {
      const dto = { text: 'Looks good', isAI: false };
      const result = await service.addComment('task-1', dto as any, 'user-1');

      expect(result.id).toBe('task-1');
      expect(mockPrismaService.taskComment.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          text: 'Looks good',
          isAI: false,
          authorId: 'user-1',
        },
      });
      expect(mockRealtimeGateway.broadcastTaskUpdated).toHaveBeenCalledWith(
        'board-1',
        expect.objectContaining({ id: 'task-1' }),
      );
    });

    it('should set authorId to null for AI comments', async () => {
      const dto = { text: 'AI suggestion', isAI: true };
      await service.addComment('task-1', dto as any, 'user-1');

      expect(mockPrismaService.taskComment.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          text: 'AI suggestion',
          isAI: true,
          authorId: null,
        },
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockPrismaService.task.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.addComment('bad-id', { text: 'Hi' } as any, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateComment', () => {
    it('should update a comment and return the updated task', async () => {
      const result = await service.updateComment(
        'task-1',
        'comment-1',
        { text: 'Edited text' } as any,
        'user-1',
      );

      expect(result.id).toBe('task-1');
      expect(mockPrismaService.taskComment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { text: 'Edited text' },
      });
      expect(mockRealtimeGateway.broadcastTaskUpdated).toHaveBeenCalledWith(
        'board-1',
        expect.objectContaining({ id: 'task-1' }),
      );
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockPrismaService.taskComment.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateComment(
          'task-1',
          'bad-comment',
          { text: 'Edited' } as any,
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if comment belongs to a different task', async () => {
      mockPrismaService.taskComment.findUnique.mockResolvedValueOnce({
        ...mockComment,
        taskId: 'other-task',
      });

      await expect(
        service.updateComment(
          'task-1',
          'comment-1',
          { text: 'Edited' } as any,
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException when a user tries to edit another user's comment", async () => {
      mockPrismaService.taskComment.findUnique.mockResolvedValueOnce({
        ...mockComment,
        isAI: false,
        authorId: 'user-2', // owned by user-2, not user-1
      });

      await expect(
        service.updateComment(
          'task-1',
          'comment-1',
          { text: 'Edited' } as any,
          'user-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeComment', () => {
    it('should delete a comment and return the updated task', async () => {
      const result = await service.removeComment(
        'task-1',
        'comment-1',
        'user-1',
      );

      expect(result.id).toBe('task-1');
      expect(mockPrismaService.taskComment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      });
      expect(mockRealtimeGateway.broadcastTaskUpdated).toHaveBeenCalledWith(
        'board-1',
        expect.objectContaining({ id: 'task-1' }),
      );
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockPrismaService.taskComment.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.removeComment('task-1', 'bad-comment', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if comment belongs to a different task', async () => {
      mockPrismaService.taskComment.findUnique.mockResolvedValueOnce({
        ...mockComment,
        taskId: 'other-task',
      });

      await expect(
        service.removeComment('task-1', 'comment-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException when a user tries to delete another user's comment", async () => {
      mockPrismaService.taskComment.findUnique.mockResolvedValueOnce({
        ...mockComment,
        isAI: false,
        authorId: 'user-2', // owned by user-2, not user-1
      });

      await expect(
        service.removeComment('task-1', 'comment-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow any user to delete an AI comment', async () => {
      mockPrismaService.taskComment.findUnique.mockResolvedValueOnce({
        ...mockComment,
        isAI: true,
        authorId: null,
      });

      const result = await service.removeComment(
        'task-1',
        'comment-1',
        'user-1',
      );

      expect(result.id).toBe('task-1');
      expect(mockPrismaService.taskComment.delete).toHaveBeenCalled();
    });
  });
});
