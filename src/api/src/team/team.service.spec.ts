import { Test, TestingModule } from '@nestjs/testing';
import { TeamService } from './team.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MemberRole } from '../../generated/client';

describe('TeamService', () => {
  let service: TeamService;

  const mockTeam = {
    id: 'team-1',
    name: 'Alpha Team',
    _count: { memberships: 1, boards: 0 },
  };

  const mockMembership = {
    id: 'mem-1',
    userId: 'user-1',
    teamId: 'team-1',
    role: MemberRole.ADMIN,
    createdAt: new Date(),
  };

  const mockInvite = {
    id: 'invite-1',
    token: 'test-token-uuid',
    teamId: 'team-1',
    role: MemberRole.EDITOR,
    createdById: 'user-1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    usedAt: null,
    team: { id: 'team-1', name: 'Alpha Team' },
  };

  const mockMembershipsWithUsers = [
    {
      role: MemberRole.ADMIN,
      user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
    },
    {
      role: MemberRole.EDITOR,
      user: { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
    },
  ];

  const mockPrismaService = {
    team: {
      create: jest.fn().mockResolvedValue(mockTeam),
      findMany: jest.fn().mockResolvedValue([mockTeam]),
      findUnique: jest.fn().mockResolvedValue(mockTeam),
      delete: jest.fn().mockResolvedValue(mockTeam),
    },
    teamMembership: {
      create: jest.fn().mockResolvedValue(mockMembership),
      upsert: jest.fn().mockResolvedValue(mockMembership),
      delete: jest.fn().mockResolvedValue(mockMembership),
      findUnique: jest.fn().mockResolvedValue(mockMembership),
      findMany: jest.fn().mockResolvedValue(mockMembershipsWithUsers),
    },
    inviteToken: {
      create: jest.fn().mockResolvedValue(mockInvite),
      findUnique: jest.fn().mockResolvedValue(mockInvite),
      update: jest.fn().mockResolvedValue({ ...mockInvite, usedAt: new Date() }),
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

  afterEach(() => jest.clearAllMocks());

  describe('createTeam', () => {
    it('should create a team, create an ADMIN membership for the creator, and return a TeamResponseDto', async () => {
      const dto = { name: 'Alpha Team' };
      const result = await service.createTeam(dto, 'user-1');

      expect(result.id).toBe('team-1');
      expect(result.name).toBe('Alpha Team');
      expect(mockPrismaService.team.create).toHaveBeenCalledWith({
        data: { name: 'Alpha Team' },
      });
      expect(mockPrismaService.teamMembership.create).toHaveBeenCalledWith({
        data: { teamId: 'team-1', userId: 'user-1', role: MemberRole.ADMIN },
      });
    });
  });

  describe('getTeams', () => {
    it('should return all teams the user has a membership in', async () => {
      const results = await service.getTeams('user-1');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('team-1');
      expect(mockPrismaService.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { memberships: { some: { userId: 'user-1' } } },
        }),
      );
    });
  });

  describe('getTeamMembers', () => {
    it('should return all members of a team with user details and role', async () => {
      const result = await service.getTeamMembers('team-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        role: MemberRole.ADMIN,
      });
      expect(result[1]).toEqual({
        id: 'user-2',
        name: 'Bob',
        email: 'bob@example.com',
        role: MemberRole.EDITOR,
      });
      expect(mockPrismaService.teamMembership.findMany).toHaveBeenCalledWith({
        where: { teamId: 'team-1' },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });

    it('should return an empty array when the team has no members', async () => {
      mockPrismaService.teamMembership.findMany.mockResolvedValueOnce([]);
      const result = await service.getTeamMembers('team-1');
      expect(result).toEqual([]);
    });
  });

  describe('getUserMembershipRole', () => {
    it('should return the role when a membership exists', async () => {
      const role = await service.getUserMembershipRole('team-1', 'user-1');
      expect(role).toBe(MemberRole.ADMIN);
      expect(mockPrismaService.teamMembership.findUnique).toHaveBeenCalledWith({
        where: { userId_teamId: { userId: 'user-1', teamId: 'team-1' } },
        select: { role: true },
      });
    });

    it('should return null when no membership exists', async () => {
      mockPrismaService.teamMembership.findUnique.mockResolvedValueOnce(null);
      const role = await service.getUserMembershipRole('team-1', 'nobody');
      expect(role).toBeNull();
    });
  });

  describe('addUserToTeam', () => {
    it('should upsert a TeamMembership with EDITOR role by default', async () => {
      await service.addUserToTeam('team-1', 'user-2');

      expect(mockPrismaService.teamMembership.upsert).toHaveBeenCalledWith({
        where: { userId_teamId: { userId: 'user-2', teamId: 'team-1' } },
        create: { userId: 'user-2', teamId: 'team-1', role: MemberRole.EDITOR },
        update: { role: MemberRole.EDITOR },
      });
    });

    it('should upsert a TeamMembership with the specified role', async () => {
      await service.addUserToTeam('team-1', 'user-2', MemberRole.VIEWER);

      expect(mockPrismaService.teamMembership.upsert).toHaveBeenCalledWith({
        where: { userId_teamId: { userId: 'user-2', teamId: 'team-1' } },
        create: { userId: 'user-2', teamId: 'team-1', role: MemberRole.VIEWER },
        update: { role: MemberRole.VIEWER },
      });
    });
  });

  describe('removeUserFromTeam', () => {
    it('should delete the TeamMembership', async () => {
      await service.removeUserFromTeam('team-1', 'user-2');

      expect(mockPrismaService.teamMembership.delete).toHaveBeenCalledWith({
        where: { userId_teamId: { userId: 'user-2', teamId: 'team-1' } },
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
      await expect(service.deleteTeam('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if the team still has boards', async () => {
      mockPrismaService.team.findUnique.mockResolvedValueOnce({
        ...mockTeam,
        _count: { memberships: 1, boards: 2 },
      });
      await expect(service.deleteTeam('team-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createInvite', () => {
    it('should create an invite token and return a token and url', async () => {
      const result = await service.createInvite('team-1', MemberRole.EDITOR, 'user-1');

      expect(result.token).toBe('test-token-uuid');
      expect(result.url).toContain('test-token-uuid');
      expect(mockPrismaService.inviteToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            teamId: 'team-1',
            role: MemberRole.EDITOR,
            createdById: 'user-1',
          }),
        }),
      );
    });
  });

  describe('joinViaInvite', () => {
    it('should create a membership and mark the invite as used', async () => {
      const result = await service.joinViaInvite('test-token-uuid', 'user-2');

      expect(result.teamId).toBe('team-1');
      expect(result.role).toBe(MemberRole.EDITOR);
      expect(result.teamName).toBe('Alpha Team');
      expect(mockPrismaService.teamMembership.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_teamId: { userId: 'user-2', teamId: 'team-1' } },
          create: expect.objectContaining({ role: MemberRole.EDITOR }),
        }),
      );
      expect(mockPrismaService.inviteToken.update).toHaveBeenCalledWith({
        where: { token: 'test-token-uuid' },
        data: { usedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException for an invalid token', async () => {
      mockPrismaService.inviteToken.findUnique.mockResolvedValueOnce(null);
      await expect(service.joinViaInvite('bad-token', 'user-2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if the invite has already been used', async () => {
      mockPrismaService.inviteToken.findUnique.mockResolvedValueOnce({
        ...mockInvite,
        usedAt: new Date(),
      });
      await expect(service.joinViaInvite('test-token-uuid', 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if the invite has expired', async () => {
      mockPrismaService.inviteToken.findUnique.mockResolvedValueOnce({
        ...mockInvite,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.joinViaInvite('test-token-uuid', 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
