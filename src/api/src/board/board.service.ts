import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardResponseDto } from './dto/board-response.dto';

@Injectable()
export class BoardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBoardDto: CreateBoardDto): Promise<BoardResponseDto> {
    const team = await this.prisma.team.findUnique({
      where: { id: createBoardDto.teamId },
    });

    if (!team) {
      throw new NotFoundException(
        `Team with ID ${createBoardDto.teamId} not found`,
      );
    }

    const board = await this.prisma.board.create({
      data: {
        name: createBoardDto.name,
        teamId: createBoardDto.teamId,
      },
      include: {
        team: true,
        _count: { select: { tasks: true } },
      },
    });

    return new BoardResponseDto(board);
  }

  async findAllByTeam(teamId: string): Promise<BoardResponseDto[]> {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    const boards = await this.prisma.board.findMany({
      where: { teamId },
      include: {
        team: true,
        _count: { select: { tasks: true } },
      },
    });

    return boards.map((board) => new BoardResponseDto(board));
  }

  async findOne(id: string): Promise<BoardResponseDto> {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        team: true,
        tasks: {
          include: { assignedTo: true },
        },
      },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }

    return new BoardResponseDto(board, true);
  }

  async update(
    id: string,
    updateBoardDto: UpdateBoardDto,
  ): Promise<BoardResponseDto> {
    const board = await this.prisma.board.findUnique({ where: { id } });

    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }

    const updated = await this.prisma.board.update({
      where: { id },
      data: { name: updateBoardDto.name },
      include: {
        team: true,
        _count: { select: { tasks: true } },
      },
    });

    return new BoardResponseDto(updated);
  }

  async remove(id: string): Promise<{ message: string }> {
    const board = await this.prisma.board.findUnique({ where: { id } });

    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }

    await this.prisma.board.delete({ where: { id } });

    return { message: 'Board deleted successfully' };
  }
}
