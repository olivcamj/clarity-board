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
import { Roles } from '../common/decorators/roles.decorators';
import { UserRole } from '../../generated/client';

@UseGuards(ClerkAuthGuard, RolesGuard)
@Controller('api/boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  /**
   * POST /api/boards
   * Create a new board for a team
   */
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  async create(@Body() createBoardDto: CreateBoardDto) {
    return this.boardService.create(createBoardDto);
  }

  /**
   * GET /api/boards/team/:teamId
   * Get all boards for a team (with task counts)
   */
  @Get('team/:teamId')
  async findAllByTeam(@Param('teamId') teamId: string) {
    return this.boardService.findAllByTeam(teamId);
  }

  /**
   * GET /api/boards/:id
   * Get a single board with its full task list
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.boardService.findOne(id);
  }

  /**
   * PUT /api/boards/:id
   * Update a board's name
   */
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ) {
    return this.boardService.update(id, updateBoardDto);
  }

  /**
   * DELETE /api/boards/:id
   * Delete a board
   */
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.boardService.remove(id);
  }
}
