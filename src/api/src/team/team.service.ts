import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MemberRole } from '../../generated/client';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { WorkspaceService } from '../workspace/workspace.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceService: WorkspaceService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async createTeam(
    createTeamDto: CreateTeamDto,
    creatorId: string,
  ): Promise<TeamResponseDto> {
    const { name } = createTeamDto;

    const [workspace] = await this.workspaceService.getMyWorkspaces(creatorId);
    const team = await this.prisma.team.create({
      data: { name, workspaceId: workspace.id },
    });

    // Creator becomes ADMIN of the new team
    await this.prisma.teamMembership.create({
      data: { teamId: team.id, userId: creatorId, role: MemberRole.ADMIN },
    });

    console.log(`✅ Team "${name}" created by user ${creatorId} (ADMIN)`);
    return new TeamResponseDto(team);
  }

  async getTeams(userId: string): Promise<TeamResponseDto[]> {
    const teams = await this.prisma.team.findMany({
      where: { memberships: { some: { userId } } },
      include: {
        _count: { select: { memberships: true, boards: true } },
      },
    });
    return teams.map((team) => new TeamResponseDto(team));
  }

  async getTeamMembers(
    teamId: string,
  ): Promise<Array<{ id: string; name: string; email: string; role: string }>> {
    const memberships = await this.prisma.teamMembership.findMany({
      where: { teamId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return memberships.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
    }));
  }

  async getUserMembershipRole(
    teamId: string,
    userId: string,
  ): Promise<MemberRole | null> {
    const membership = await this.prisma.teamMembership.findUnique({
      where: { userId_teamId: { userId, teamId } },
      select: { role: true },
    });
    return membership?.role ?? null;
  }

  async addUserToTeam(
    teamId: string,
    userId: string,
    role: MemberRole = MemberRole.EDITOR,
  ) {
    return this.prisma.teamMembership.upsert({
      where: { userId_teamId: { userId, teamId } },
      create: { userId, teamId, role },
      update: { role },
    });
  }

  async removeUserFromTeam(teamId: string, userId: string) {
    return this.prisma.teamMembership.delete({
      where: { userId_teamId: { userId, teamId } },
    });
  }

  async deleteTeam(teamId: string): Promise<{ message: string }> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { _count: { select: { boards: true } } },
    });

    if (!team) throw new NotFoundException(`Team ${teamId} not found`);

    if (team._count.boards > 0) {
      throw new BadRequestException(
        `Cannot delete team with ${team._count.boards} board(s). Delete boards first.`,
      );
    }

    await this.prisma.team.delete({ where: { id: teamId } });
    return { message: `Team "${team.name}" deleted successfully` };
  }

  // ── Invite links ───────────────────────────────────────────────────────────

  async createInvite(
    teamId: string,
    role: MemberRole,
    createdById: string,
  ): Promise<{ token: string; url: string }> {
    const invite = await this.prisma.inviteToken.create({
      data: {
        teamId,
        role,
        createdById,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return {
      token: invite.token,
      url: `${baseUrl}/join?token=${invite.token}`,
    };
  }

  async joinViaInvite(
    token: string,
    userId: string,
  ): Promise<{ teamId: string; role: MemberRole; teamName: string }> {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token },
      include: { team: true },
    });

    if (!invite) throw new NotFoundException('Invalid invite token');
    if (invite.usedAt) throw new BadRequestException('Invite already used');
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite has expired');
    }

    await this.prisma.teamMembership.upsert({
      where: { userId_teamId: { userId, teamId: invite.teamId } },
      create: { userId, teamId: invite.teamId, role: invite.role },
      update: { role: invite.role },
    });

    await this.prisma.inviteToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    const joinedUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (joinedUser) {
      this.realtimeGateway.broadcastMemberJoined(invite.teamId, {
        ...joinedUser,
        role: invite.role,
      });
    }

    return {
      teamId: invite.teamId,
      role: invite.role,
      teamName: invite.team.name,
    };
  }
}
