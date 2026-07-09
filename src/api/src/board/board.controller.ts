import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { TeamMemberGuard } from '../guards/team-member.guard';
import { TeamRoles } from '../common/decorators/team-roles.decorator';
import { ResourceContext } from '../common/decorators/resource-type.decorator';
import { MemberRole } from '../../generated/client';

@UseGuards(ClerkAuthGuard, RolesGuard, TeamMemberGuard)
@Controller('api/boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  // EDITOR+ can create a board (teamId resolved from request body)
  @ResourceContext('board')
  @TeamRoles(MemberRole.EDITOR, MemberRole.ADMIN)
  @Post()
  async create(@Body() dto: CreateBoardDto) {
    return this.boardService.create(dto);
  }

  // Any team member (VIEWER+) can list a team's boards
  @ResourceContext('team')
  @TeamRoles(MemberRole.VIEWER, MemberRole.EDITOR, MemberRole.ADMIN)
  @Get('team/:teamId')
  async findAllByTeam(@Param('teamId') teamId: string) {
    return this.boardService.findAllByTeam(teamId);
  }

  // Any team member can view a board
  @ResourceContext('board')
  @TeamRoles(MemberRole.VIEWER, MemberRole.EDITOR, MemberRole.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.boardService.findOne(id);
  }

  // EDITOR+ can rename a board
  @ResourceContext('board')
  @TeamRoles(MemberRole.EDITOR, MemberRole.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBoardDto) {
    return this.boardService.update(id, dto);
  }

  // ADMIN only can delete a board
  @ResourceContext('board')
  @TeamRoles(MemberRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.boardService.remove(id);
  }
}
