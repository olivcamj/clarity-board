import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../../generated/client';

@UseGuards(ClerkAuthGuard, RolesGuard)
@Controller('api')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('boards/:boardId/tasks')
  findAllByBoard(@Param('boardId') boardId: string) {
    return this.taskService.findAllByBoard(boardId);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post('boards/:boardId/tasks')
  create(
    @Param('boardId') boardId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() currentUser: { userId: string },
  ) {
    return this.taskService.create(boardId, dto, currentUser.userId);
  }

  @Get('tasks/:id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch('tasks/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.taskService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete('tasks/:id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(id);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post('tasks/:id/subtasks')
  addSubtask(@Param('id') taskId: string, @Body() dto: CreateSubtaskDto) {
    return this.taskService.addSubtask(taskId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch('tasks/:id/subtasks/:subtaskId')
  updateSubtask(
    @Param('id') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @Body() dto: UpdateSubtaskDto,
  ) {
    return this.taskService.updateSubtask(taskId, subtaskId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Delete('tasks/:id/subtasks/:subtaskId')
  removeSubtask(
    @Param('id') taskId: string,
    @Param('subtaskId') subtaskId: string,
  ) {
    return this.taskService.removeSubtask(taskId, subtaskId);
  }

  @Post('tasks/:id/comments')
  addComment(
    @Param('id') taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() currentUser: { userId: string },
  ) {
    return this.taskService.addComment(taskId, dto, currentUser.userId);
  }

  @Delete('tasks/:id/comments/:commentId')
  removeComment(
    @Param('id') taskId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() currentUser: { userId: string },
  ) {
    return this.taskService.removeComment(
      taskId,
      commentId,
      currentUser.userId,
    );
  }
}
