import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, Priority } from '../../generated/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { TaskResponseDto, taskIncludes } from './dto/task-response.dto';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByBoard(boardId: string): Promise<TaskResponseDto[]> {
    await this.requireBoard(boardId);
    const tasks = await this.prisma.task.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
      include: taskIncludes,
    });
    return tasks.map(TaskResponseDto.fromPrisma);
  }

  async create(
    boardId: string,
    dto: CreateTaskDto,
    userId: string,
  ): Promise<TaskResponseDto> {
    await this.requireBoard(boardId);

    const maxPosition = await this.prisma.task.aggregate({
      where: { boardId },
      _max: { position: true },
    });
    const position = dto.position ?? (maxPosition._max.position ?? -1) + 1;

    const task = await this.prisma.task.create({
      data: {
        boardId,
        title: dto.title,
        description: dto.description,
        status: dto.status ?? TaskStatus.TODO,
        priority: dto.priority ?? Priority.MED,
        labels: dto.labels ?? [],
        due: dto.due,
        sprint: dto.sprint,
        position,
        aiGenerated: dto.aiGenerated ?? false,
        source: dto.source,
        createdById: userId,
        assignees: dto.assigneeIds?.length
          ? { connect: dto.assigneeIds.map((id) => ({ id })) }
          : undefined,
      },
      include: taskIncludes,
    });

    return TaskResponseDto.fromPrisma(task);
  }

  async findOne(id: string): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: taskIncludes,
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return TaskResponseDto.fromPrisma(task);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<TaskResponseDto> {
    await this.requireTask(id);

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.labels !== undefined && { labels: dto.labels }),
        ...(dto.due !== undefined && { due: dto.due }),
        ...(dto.sprint !== undefined && { sprint: dto.sprint }),
        ...(dto.position !== undefined && { position: dto.position }),
        ...(dto.aiGenerated !== undefined && { aiGenerated: dto.aiGenerated }),
        ...(dto.source !== undefined && { source: dto.source }),
        ...(dto.assigneeIds !== undefined && {
          assignees: {
            set: dto.assigneeIds.map((aid) => ({ id: aid })),
          },
        }),
      },
      include: taskIncludes,
    });

    return TaskResponseDto.fromPrisma(task);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.requireTask(id);
    await this.prisma.task.delete({ where: { id } });
    return { message: 'Task deleted successfully' };
  }

  async addSubtask(
    taskId: string,
    dto: CreateSubtaskDto,
  ): Promise<TaskResponseDto> {
    await this.requireTask(taskId);

    const maxPos = await this.prisma.subtask.aggregate({
      where: { taskId },
      _max: { position: true },
    });
    const position = (maxPos._max.position ?? -1) + 1;

    await this.prisma.subtask.create({
      data: { taskId, text: dto.text, done: dto.done ?? false, position },
    });

    return this.findOne(taskId);
  }

  async updateSubtask(
    taskId: string,
    subtaskId: string,
    dto: UpdateSubtaskDto,
  ): Promise<TaskResponseDto> {
    const subtask = await this.prisma.subtask.findUnique({
      where: { id: subtaskId },
    });
    if (!subtask || subtask.taskId !== taskId) {
      throw new NotFoundException(
        `Subtask ${subtaskId} not found on task ${taskId}`,
      );
    }

    await this.prisma.subtask.update({
      where: { id: subtaskId },
      data: {
        ...(dto.text !== undefined && { text: dto.text }),
        ...(dto.done !== undefined && { done: dto.done }),
        ...(dto.position !== undefined && { position: dto.position }),
      },
    });

    return this.findOne(taskId);
  }

  async removeSubtask(
    taskId: string,
    subtaskId: string,
  ): Promise<TaskResponseDto> {
    const subtask = await this.prisma.subtask.findUnique({
      where: { id: subtaskId },
    });
    if (!subtask || subtask.taskId !== taskId) {
      throw new NotFoundException(
        `Subtask ${subtaskId} not found on task ${taskId}`,
      );
    }

    await this.prisma.subtask.delete({ where: { id: subtaskId } });
    return this.findOne(taskId);
  }

  async addComment(
    taskId: string,
    dto: CreateCommentDto,
    userId: string,
  ): Promise<TaskResponseDto> {
    await this.requireTask(taskId);

    await this.prisma.taskComment.create({
      data: {
        taskId,
        text: dto.text,
        isAI: dto.isAI ?? false,
        authorId: dto.isAI ? null : userId,
      },
    });

    return this.findOne(taskId);
  }

  async removeComment(
    taskId: string,
    commentId: string,
    userId: string,
  ): Promise<TaskResponseDto> {
    const comment = await this.prisma.taskComment.findUnique({
      where: { id: commentId },
    });
    if (!comment || comment.taskId !== taskId) {
      throw new NotFoundException(
        `Comment ${commentId} not found on task ${taskId}`,
      );
    }
    if (!comment.isAI && comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.taskComment.delete({ where: { id: commentId } });
    return this.findOne(taskId);
  }

  private async requireBoard(boardId: string): Promise<void> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });
    if (!board) throw new NotFoundException(`Board ${boardId} not found`);
  }

  private async requireTask(id: string): Promise<void> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
  }
}
