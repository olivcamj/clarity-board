import { Test, TestingModule } from '@nestjs/testing';
import { TeamService } from './team.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TeamService', () => {
  let service: TeamService;

  const mockUser = {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
    role: 'ADMIN',
  };

  const mockTeam = {
    id: 'team-1',
    name: 'Alpha Team',
    _count: { users: 1, boards: 0 },
  };

  const mockTeamWithUsers = {
    id: 'team-1',
    name: 'Alpha Team',
    users: [mockUser],
  };

  const mockPrismaService = {
    team: {
      create: jest.fn().mockResolvedValue(mockTeam),
      findMany: jest.fn().mockResolvedValue([mockTeam]),
      findUnique: jest.fn().mockResolvedValue(mockTeam),
      update: jest.fn().mockResolvedValue(mockTeamWithUsers),
      delete: jest.fn().mockResolvedValue(mockTeam),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([mockUser]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TeamService>(TeamService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTeam', () => {
    it('should create a team and return a TeamResponseDto', async () => {
      const dto = { name: 'Alpha Team', userIds: [] };
      const result = await service.createTeam(dto, 'user-1');

      expect(result.id).toBe('team-1');
      expect(result.name).toBe('Alpha Team');
      expect(result.userCount).toBe(1);
      expect(result.boardCount).toBe(0);
      expect(mockPrismaService.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Alpha Team' }),
        }),
      );
    });

    it('should throw BadRequestException if any userId is invalid', async () => {
      // validateUsers returns fewer users than requested → count mismatch
      mockPrismaService.user.findMany.mockResolvedValueOnce([]);
      await expect(
        service.createTeam({ name: 'Team', userIds: ['bad-id'] }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTeams', () => {
    it('should return all teams the user belongs to', async () => {
      const results = await service.getTeams('user-1');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('team-1');
      expect(mockPrismaService.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { users: { some: { id: 'user-1' } } },
        }),
      );
    });
  });

  describe('addUserToTeam', () => {
    it('should connect a user to the team', async () => {
      const result = await service.addUserToTeam('team-1', 'user-2');

      expect(result).toEqual(mockTeamWithUsers);
      expect(mockPrismaService.team.update).toHaveBeenCalledWith({
        where: { id: 'team-1' },
        data: { users: { connect: { id: 'user-2' } } },
        include: { users: true },
      });
    });
  });

  describe('removeUserFromTeam', () => {
    it('should disconnect a user from the team', async () => {
      const result = await service.removeUserFromTeam('team-1', 'user-2');

      expect(result).toEqual(mockTeamWithUsers);
      expect(mockPrismaService.team.update).toHaveBeenCalledWith({
        where: { id: 'team-1' },
        data: { users: { disconnect: { id: 'user-2' } } },
        include: { users: true },
      });
    });
  });

  describe('deleteTeam', () => {
    it('should delete a team with no boards and return a success message', async () => {
      const result = await service.deleteTeam('team-1');

      expect(result.message).toContain('Alpha Team');
      expect(mockPrismaService.team.delete).toHaveBeenCalledWith({
        where: { id: 'team-1' },
      });
    });

    it('should throw NotFoundException if team does not exist', async () => {
      mockPrismaService.team.findUnique.mockResolvedValueOnce(null);
      await expect(service.deleteTeam('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if team still has boards', async () => {
      mockPrismaService.team.findUnique.mockResolvedValueOnce({
        ...mockTeam,
        _count: { users: 1, boards: 2 },
      });
      await expect(service.deleteTeam('team-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
