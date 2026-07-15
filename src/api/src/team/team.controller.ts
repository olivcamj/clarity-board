import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ClerkAuthGuard } from 'src/guards/clerk-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { TeamMemberGuard } from 'src/guards/team-member.guard';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TeamRoles } from 'src/common/decorators/team-roles.decorator';
import { ResourceContext } from 'src/common/decorators/resource-type.decorator';
import { MemberRole } from '../../generated/client';
import { IsEnum, IsString } from 'class-validator';

class CreateInviteDto {
  @IsEnum(MemberRole)
  role!: MemberRole;
}

class JoinViaInviteDto {
  @IsString()
  token!: string;
}

@UseGuards(ClerkAuthGuard, RolesGuard, TeamMemberGuard)
@Controller('api/team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  // Any authenticated user can create a team — they become its ADMIN
  @Post()
  async createTeam(
    @Body() createTeamDto: CreateTeamDto,
    @CurrentUser() user: any,
  ) {
    return this.teamService.createTeam(createTeamDto, user.userId);
  }

  @Get()
  async getTeams(@Query('userId') userId: string) {
    return this.teamService.getTeams(userId);
  }

  // Add a member — ADMIN only
  @ResourceContext('team')
  @TeamRoles(MemberRole.ADMIN)
  @Post(':teamId/users/:userId')
  async addUser(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @Body('role') role: MemberRole = MemberRole.EDITOR,
  ) {
    return this.teamService.addUserToTeam(teamId, userId, role);
  }

  // Remove a member — ADMIN only
  @ResourceContext('team')
  @TeamRoles(MemberRole.ADMIN)
  @Delete(':teamId/users/:userId')
  async removeUser(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
  ) {
    return this.teamService.removeUserFromTeam(teamId, userId);
  }

  // Generate an invite link — ADMIN only
  @ResourceContext('team')
  @TeamRoles(MemberRole.ADMIN)
  @Post(':teamId/invite')
  async createInvite(
    @Param('teamId') teamId: string,
    @Body() dto: CreateInviteDto,
    @CurrentUser() user: any,
  ) {
    return this.teamService.createInvite(teamId, dto.role, user.userId);
  }

  // Consume an invite token — any authenticated user
  @Post('join')
  async joinViaInvite(@Body() dto: JoinViaInviteDto, @CurrentUser() user: any) {
    return this.teamService.joinViaInvite(dto.token, user.userId);
  }

  // Get team members — any member can view
  @ResourceContext('team')
  @TeamRoles(MemberRole.VIEWER, MemberRole.EDITOR, MemberRole.ADMIN)
  @Get(':teamId/members')
  getTeamMembers(@Param('teamId') teamId: string) {
    return this.teamService.getTeamMembers(teamId);
  }

  // Delete team — ADMIN only
  @ResourceContext('team')
  @TeamRoles(MemberRole.ADMIN)
  @Delete(':teamId')
  async deleteTeam(@Param('teamId') teamId: string) {
    return this.teamService.deleteTeam(teamId);
  }
}
