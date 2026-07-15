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
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { TeamMemberGuard } from '../guards/team-member.guard';
import { TeamRoles } from '../common/decorators/team-roles.decorator';
import { ResourceContext } from '../common/decorators/resource-type.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MemberRole } from '../../generated/client';

@UseGuards(ClerkAuthGuard, RolesGuard, TeamMemberGuard)
@Controller('api')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // Any team member can view tasks on a board
  @ResourceContext('board')
  @TeamRoles(MemberRole.VIEWER, MemberRole.EDITOR, MemberRole.ADMIN)
  @Get('boards/:boardId/tasks')
  findAllByBoard(@Param('boardId') boardId: string) {
    return this.taskService.findAllByBoard(boardId);
  }

  // EDITOR+ can create a task
  @ResourceContext('board')
  @TeamRoles(MemberRole.EDITOR, MemberRole.ADMIN)
  @Post('boards/:boardId/tasks')
  create(
    @Param('boardId') boardId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() currentUser: { userId: string },
  ) {
    return this.taskService.create(boardId, dto, currentUser.userId);
  }

  // Any team member can view a task
  @ResourceContext('task')
  @TeamRoles(MemberRole.VIEWER, MemberRole.EDITOR, MemberRole.ADMIN)
  @Get('tasks/:id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  // EDITOR+ can update a task
  @ResourceContext('task')
  @TeamRoles(MemberRole.EDITOR, MemberRole.ADMIN)
  @Patch('tasks/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() currentUser: { userId: string },
  ) {
    return this.taskService.update(id, dto, currentUser.userId);
  }

  // ADMIN only can delete a task
  @ResourceContext('task')
  @TeamRoles(MemberRole.ADMIN)
  @Delete('tasks/:id')
  remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: { userId: string },
  ) {
    return this.taskService.remove(id, currentUser.userId);
  }

  // EDITOR+ can manage subtasks
  @ResourceContext('task')
  @TeamRoles(MemberRole.EDITOR, MemberRole.ADMIN)
  @Post('tasks/:id/subtasks')
  addSubtask(@Param('id') taskId: string, @Body() dto: CreateSubtaskDto) {
    return this.taskService.addSubtask(taskId, dto);
  }

  @ResourceContext('task')
  @TeamRoles(MemberRole.EDITOR, MemberRole.ADMIN)
  @Patch('tasks/:id/subtasks/:subtaskId')
  updateSubtask(
    @Param('id') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @Body() dto: UpdateSubtaskDto,
  ) {
    return this.taskService.updateSubtask(taskId, subtaskId, dto);
  }

  @ResourceContext('task')
  @TeamRoles(MemberRole.EDITOR, MemberRole.ADMIN)
  @Delete('tasks/:id/subtasks/:subtaskId')
  removeSubtask(
    @Param('id') taskId: string,
    @Param('subtaskId') subtaskId: string,
  ) {
    return this.taskService.removeSubtask(taskId, subtaskId);
  }

  // EDITOR+ can post comments
  @ResourceContext('task')
  @TeamRoles(MemberRole.EDITOR, MemberRole.ADMIN)
  @Post('tasks/:id/comments')
  addComment(
    @Param('id') taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() currentUser: { userId: string },
  ) {
    return this.taskService.addComment(taskId, dto, currentUser.userId);
  }

  @ResourceContext('task')
  @TeamRoles(MemberRole.EDITOR, MemberRole.ADMIN)
  @Patch('tasks/:id/comments/:commentId')
  updateComment(
    @Param('id') taskId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() currentUser: { userId: string },
  ) {
    return this.taskService.updateComment(
      taskId,
      commentId,
      dto,
      currentUser.userId,
    );
  }

  @ResourceContext('task')
  @TeamRoles(MemberRole.EDITOR, MemberRole.ADMIN)
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
