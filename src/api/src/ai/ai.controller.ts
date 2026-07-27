import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateTasksDto } from './dto/generate-tasks.dto';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { TeamMemberGuard } from '../guards/team-member.guard';
import { TeamRoles } from '../common/decorators/team-roles.decorator';
import { ResourceContext } from '../common/decorators/resource-type.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MemberRole } from '../../generated/client';

@UseGuards(ClerkAuthGuard, RolesGuard, TeamMemberGuard)
@Controller('api')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // Not board-scoped! The cap is per-user, lifetime, across all boards.
  @Get('ai/usage')
  getUsage(@CurrentUser() currentUser: { userId: string }) {
    return this.aiService.getUsage(currentUser.userId);
  }

  // EDITOR+ can generate suggestions, same bar as creating a real task
  @ResourceContext('board')
  @TeamRoles(MemberRole.EDITOR, MemberRole.ADMIN)
  @Post('boards/:boardId/ai/generate-tasks')
  generateTasks(
    @Param('boardId') boardId: string,
    @Body() dto: GenerateTasksDto,
    @CurrentUser() currentUser: { userId: string },
  ) {
    return this.aiService.generateTaskSuggestions(
      boardId,
      dto.input,
      currentUser.userId,
    );
  }

  // EDITOR+ can break a task down, same bar as adding a subtask manually
  @ResourceContext('task')
  @TeamRoles(MemberRole.EDITOR, MemberRole.ADMIN)
  @Post('tasks/:id/ai/breakdown')
  breakdownTask(
    @Param('id') id: string,
    @CurrentUser() currentUser: { userId: string },
  ) {
    return this.aiService.breakdownTask(id, currentUser.userId);
  }
}
