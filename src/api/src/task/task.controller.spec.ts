import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

describe('TaskController', () => {
  let controller: TaskController;

  // A TaskResponseDto-shaped object returned by all service mock methods.
  const mockTaskDto = {
    id: 'task-1',
    boardId: 'board-1',
    title: 'Fix bug',
    description: 'A serious bug',
    status: 'todo',
    priority: 'med',
    labels: ['bug'],
    due: undefined,
    sprint: 'Sprint 1',
    position: 0,
    aiGenerated: false,
    source: undefined,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    createdBy: { id: 'user-1', name: 'Alice' },
    assignees: [],
    subtasks: [],
    comments: [],
    attachments: [],
  };

  const mockTaskService = {
    findAllByBoard: jest.fn().mockResolvedValue([mockTaskDto]),
    create: jest.fn().mockResolvedValue(mockTaskDto),
    findOne: jest.fn().mockResolvedValue(mockTaskDto),
    update: jest.fn().mockResolvedValue(mockTaskDto),
    remove: jest
      .fn()
      .mockResolvedValue({ message: 'Task deleted successfully' }),
    addSubtask: jest.fn().mockResolvedValue(mockTaskDto),
    updateSubtask: jest.fn().mockResolvedValue(mockTaskDto),
    removeSubtask: jest.fn().mockResolvedValue(mockTaskDto),
    addComment: jest.fn().mockResolvedValue(mockTaskDto),
    removeComment: jest.fn().mockResolvedValue(mockTaskDto),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [{ provide: TaskService, useValue: mockTaskService }],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TaskController>(TaskController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllByBoard', () => {
    it('should call taskService.findAllByBoard and return an array of tasks', async () => {
      const result = await controller.findAllByBoard('board-1');

      expect(result).toEqual([mockTaskDto]);
      expect(mockTaskService.findAllByBoard).toHaveBeenCalledWith('board-1');
    });
  });

  describe('create', () => {
    it('should call taskService.create with boardId, dto, and userId from CurrentUser', async () => {
      const dto = { title: 'Fix bug', labels: ['bug'] };
      const fakeUser = { userId: 'user-1' };

      const result = await controller.create(
        'board-1',
        dto as any,
        fakeUser as any,
      );

      expect(result).toEqual(mockTaskDto);
      expect(mockTaskService.create).toHaveBeenCalledWith(
        'board-1',
        dto,
        'user-1',
      );
    });
  });

  describe('findOne', () => {
    it('should call taskService.findOne and return the task', async () => {
      const result = await controller.findOne('task-1');

      expect(result).toEqual(mockTaskDto);
      expect(mockTaskService.findOne).toHaveBeenCalledWith('task-1');
    });
  });

  describe('update', () => {
    it('should call taskService.update with id and dto, then return the updated task', async () => {
      const dto = { title: 'Updated title', status: 'REVIEW' as any };

      const result = await controller.update('task-1', dto);

      expect(result).toEqual(mockTaskDto);
      expect(mockTaskService.update).toHaveBeenCalledWith('task-1', dto);
    });
  });

  describe('remove', () => {
    it('should call taskService.remove and return the success message', async () => {
      const result = await controller.remove('task-1');

      expect(result).toEqual({ message: 'Task deleted successfully' });
      expect(mockTaskService.remove).toHaveBeenCalledWith('task-1');
    });
  });

  describe('addSubtask', () => {
    it('should call taskService.addSubtask and return the updated task', async () => {
      const dto = { text: 'Write unit tests' };

      const result = await controller.addSubtask('task-1', dto as any);

      expect(result).toEqual(mockTaskDto);
      expect(mockTaskService.addSubtask).toHaveBeenCalledWith('task-1', dto);
    });
  });

  describe('updateSubtask', () => {
    it('should call taskService.updateSubtask with taskId, subtaskId, and dto', async () => {
      const dto = { done: true };

      const result = await controller.updateSubtask(
        'task-1',
        'subtask-1',
        dto as any,
      );

      expect(result).toEqual(mockTaskDto);
      expect(mockTaskService.updateSubtask).toHaveBeenCalledWith(
        'task-1',
        'subtask-1',
        dto,
      );
    });
  });

  describe('removeSubtask', () => {
    it('should call taskService.removeSubtask with taskId and subtaskId', async () => {
      const result = await controller.removeSubtask('task-1', 'subtask-1');

      expect(result).toEqual(mockTaskDto);
      expect(mockTaskService.removeSubtask).toHaveBeenCalledWith(
        'task-1',
        'subtask-1',
      );
    });
  });

  describe('addComment', () => {
    it('should call taskService.addComment with taskId, dto, and userId from CurrentUser', async () => {
      const dto = { text: 'LGTM', isAI: false };
      const fakeUser = { userId: 'user-1' };

      const result = await controller.addComment(
        'task-1',
        dto as any,
        fakeUser as any,
      );

      expect(result).toEqual(mockTaskDto);
      expect(mockTaskService.addComment).toHaveBeenCalledWith(
        'task-1',
        dto,
        'user-1',
      );
    });
  });

  describe('removeComment', () => {
    it('should call taskService.removeComment with taskId, commentId, and userId from CurrentUser', async () => {
      const fakeUser = { userId: 'user-1' };

      const result = await controller.removeComment(
        'task-1',
        'comment-1',
        fakeUser as any,
      );

      expect(result).toEqual(mockTaskDto);
      expect(mockTaskService.removeComment).toHaveBeenCalledWith(
        'task-1',
        'comment-1',
        'user-1',
      );
    });
  });
});
