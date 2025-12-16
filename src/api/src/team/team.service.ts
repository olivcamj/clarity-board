import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamResponseDto } from './dto/team-response.dto';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async createTeam(
    createTeamDto: CreateTeamDto,
    creatorId: string,
  ): Promise<TeamResponseDto> {
    const { name, userIds = [] } = createTeamDto;

    const uniqueUserIds = Array.from(new Set([creatorId, ...userIds]));

    await this.validateUsers(uniqueUserIds);

    const team = await this.prisma.team.create({
      data: {
        name,
        users: {
          connect: uniqueUserIds.map((id) => ({ id })),
        },
      },
      include: {
        _count: {
          select: { users: true, boards: true },
        },
      },
    });
    console.log(`✅ Team "${name}" created by user ${creatorId}.`);
    return new TeamResponseDto(team);
  }

  async deleteTeam(teamId: string): Promise<{ message: string }> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        _count: {
          select: { boards: true },
        },
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found.`);
    }

    if (team._count.boards > 0) {
      throw new BadRequestException(
        `Cannot delete team with ${team._count.boards} board(s). Delete boards first.`,
      );
    }

    await this.prisma.team.delete({
      where: { id: teamId },
    });

    console.log(`🗑️ Team ${teamId} deleted`);
    return { message: `Team "${team.name}" deleted successfully` };
  }

  private async validateUsers(userIds: string[]): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
    });

    if (users.length !== userIds.length) {
      throw new BadRequestException('One or more IDs are invalid.');
    }
  }
}
