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
import { TeamService } from './team.service';
import { Roles } from '../common/decorators/roles.decorators';
import { CreateTeamDto } from './dto/create-team.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from '../../generated/client';

@UseGuards(ClerkAuthGuard, RolesGuard)
@Controller('api/team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  async createTeam(
    @Body() createTeamDto: CreateTeamDto,
    @CurrentUser() user: any,
  ) {
    return await this.teamService.createTeam(createTeamDto, user.userId);
  }

  @Get()
  async getTeams(@Query('userId') userId: string) {
    return this.teamService.getTeams(userId);
  }

  @Post(':teamId/users/:userId')
  async addUser(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
  ) {
    return await this.teamService.addUserToTeam(teamId, userId);
  }

  @Delete(':teamId/users/:userId')
  async removeUser(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
  ) {
    return await this.teamService.removeUserFromTeam(teamId, userId);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async deleteTeam(@Param('id') id: string) {
    return await this.teamService.deleteTeam(id);
  }
}
