import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberRole } from '../../generated/client';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyWorkspaces(userId: string): Promise<WorkspaceResponseDto[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
    });

    if (memberships.length === 0) {
      return this.getOrCreateDefaultWorkspace(userId);
    }

    return memberships.map(
      (membership) =>
        new WorkspaceResponseDto(membership.workspace, membership.role),
    );
  }

  private async getOrCreateDefaultWorkspace(
    userId: string,
  ): Promise<WorkspaceResponseDto[]> {
    const result = await this.prisma.$transaction(async (transaction) => {
      const workspace = await transaction.workspace.create({
        data: { name: 'My Workspace' },
      });

      const member = await transaction.workspaceMember.create({
        data: { userId, workspaceId: workspace.id, role: MemberRole.ADMIN },
      });
      return { workspace, member };
    });

    return [new WorkspaceResponseDto(result.workspace, result.member.role)];
  }

  async renameWorkspace(
    workspaceId: string,
    userId: string,
    name: string,
  ): Promise<WorkspaceResponseDto> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (membership.role !== MemberRole.ADMIN) {
      throw new ForbiddenException(
        'Only workspace admins can rename the workspace',
      );
    }

    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name },
    });

    return new WorkspaceResponseDto(workspace, membership.role);
  }
}
