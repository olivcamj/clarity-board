import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { TEAM_ROLES_KEY } from '../common/decorators/team-roles.decorator';
import {
  RESOURCE_TYPE_KEY,
  type ResourceType,
} from '../common/decorators/resource-type.decorator';
import { MemberRole } from '../../generated/client';

@Injectable()
export class TeamMemberGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(
      TEAM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException('User not authenticated');

    const teamId = await this.resolveTeamId(context, request);

    if (!teamId) {
      throw new ForbiddenException('Could not determine team context');
    }

    const membership = await this.prisma.teamMembership.findUnique({
      where: { userId_teamId: { userId: user.id, teamId } },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this team');
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `Requires role: ${requiredRoles.join(' or ')}. Your role: ${membership.role}`,
      );
    }

    return true;
  }

  private async resolveTeamId(
    context: ExecutionContext,
    request: any,
  ): Promise<string | null> {
    const resourceType = this.reflector.getAllAndOverride<ResourceType>(
      RESOURCE_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const params: Record<string, string> = request.params ?? {};
    const body: Record<string, any> = request.body ?? {};

    switch (resourceType) {
      case 'team':
        return params.teamId ?? body.teamId ?? null;

      case 'board': {
        // POST /api/boards — teamId comes from body, no boardId param yet
        if (!params.boardId && !params.id) return body.teamId ?? null;
        const boardId = params.boardId ?? params.id;
        const board = await this.prisma.board.findUnique({
          where: { id: boardId },
          select: { teamId: true },
        });
        return board?.teamId ?? null;
      }

      case 'task': {
        const taskId = params.id;
        if (!taskId) return null;
        const task = await this.prisma.task.findUnique({
          where: { id: taskId },
          select: { board: { select: { teamId: true } } },
        });
        return task?.board?.teamId ?? null;
      }

      default:
        return params.teamId ?? body.teamId ?? null;
    }
  }
}
