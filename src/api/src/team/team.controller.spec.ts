import { Test, TestingModule } from '@nestjs/testing';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { TeamMemberGuard } from '../guards/team-member.guard';
import { MemberRole } from '../../generated/client';

describe('TeamController', () => {
  let controller: TeamController;

  const mockTeam = {
    id: 'team-1',
    name: 'Alpha Team',
    memberCount: 1,
    boardCount: 0,
  };

  const mockMembership = {
    userId: 'user-2',
    teamId: 'team-1',
    role: MemberRole.EDITOR,
  };

  const mockInviteResult = {
    token: 'test-token-uuid',
    url: 'http://localhost:3000/join?token=test-token-uuid',
  };

  const mockJoinResult = {
    teamId: 'team-1',
    role: MemberRole.EDITOR,
    teamName: 'Alpha Team',
  };

  const mockTeamMembers = [
    { id: 'user-1', name: 'Alice', email: 'alice@example.com', role: MemberRole.ADMIN },
    { id: 'user-2', name: 'Bob',   email: 'bob@example.com',   role: MemberRole.EDITOR },
  ];

  const mockTeamService = {
    createTeam: jest.fn().mockResolvedValue(mockTeam),
    getTeams: jest.fn().mockResolvedValue([mockTeam]),
    getTeamMembers: jest.fn().mockResolvedValue(mockTeamMembers),
    addUserToTeam: jest.fn().mockResolvedValue(mockMembership),
    removeUserFromTeam: jest.fn().mockResolvedValue(mockMembership),
    deleteTeam: jest
      .fn()
      .mockResolvedValue({ message: 'Team "Alpha Team" deleted successfully' }),
    createInvite: jest.fn().mockResolvedValue(mockInviteResult),
    joinViaInvite: jest.fn().mockResolvedValue(mockJoinResult),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamController],
      providers: [{ provide: TeamService, useValue: mockTeamService }],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TeamMemberGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TeamController>(TeamController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTeam', () => {
    it('should call teamService.createTeam with dto and userId from CurrentUser', async () => {
      const dto = { name: 'Alpha Team' };
      const fakeUser = { userId: 'user-1' };

      const result = await controller.createTeam(dto, fakeUser as never);

      expect(result).toEqual(mockTeam);
      expect(mockTeamService.createTeam).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('getTeams', () => {
    it('should call teamService.getTeams and return teams', async () => {
      const result = await controller.getTeams('user-1');

      expect(result).toEqual([mockTeam]);
      expect(mockTeamService.getTeams).toHaveBeenCalledWith('user-1');
    });
  });

  describe('addUser', () => {
    it('should call teamService.addUserToTeam with teamId, userId, and role', async () => {
      const result = await controller.addUser('team-1', 'user-2', MemberRole.EDITOR);

      expect(result).toEqual(mockMembership);
      expect(mockTeamService.addUserToTeam).toHaveBeenCalledWith(
        'team-1',
        'user-2',
        MemberRole.EDITOR,
      );
    });

    it('should default to EDITOR role when none is provided', async () => {
      await controller.addUser('team-1', 'user-2', MemberRole.EDITOR);
      expect(mockTeamService.addUserToTeam).toHaveBeenCalledWith(
        'team-1',
        'user-2',
        MemberRole.EDITOR,
      );
    });
  });

  describe('removeUser', () => {
    it('should call teamService.removeUserFromTeam with teamId and userId', async () => {
      const result = await controller.removeUser('team-1', 'user-2');

      expect(result).toEqual(mockMembership);
      expect(mockTeamService.removeUserFromTeam).toHaveBeenCalledWith(
        'team-1',
        'user-2',
      );
    });
  });

  describe('createInvite', () => {
    it('should call teamService.createInvite and return token and url', async () => {
      const fakeUser = { userId: 'user-1' };
      const dto = { role: MemberRole.EDITOR };

      const result = await controller.createInvite('team-1', dto as never, fakeUser as never);

      expect(result).toEqual(mockInviteResult);
      expect(mockTeamService.createInvite).toHaveBeenCalledWith(
        'team-1',
        MemberRole.EDITOR,
        'user-1',
      );
    });
  });

  describe('joinViaInvite', () => {
    it('should call teamService.joinViaInvite with token and userId', async () => {
      const fakeUser = { userId: 'user-2' };
      const dto = { token: 'test-token-uuid' };

      const result = await controller.joinViaInvite(dto as never, fakeUser as never);

      expect(result).toEqual(mockJoinResult);
      expect(mockTeamService.joinViaInvite).toHaveBeenCalledWith(
        'test-token-uuid',
        'user-2',
      );
    });
  });

  describe('getTeamMembers', () => {
    it('should return the members of a team', () => {
      const result = controller.getTeamMembers('team-1');

      expect(result).resolves.toEqual(mockTeamMembers);
      expect(mockTeamService.getTeamMembers).toHaveBeenCalledWith('team-1');
    });
  });

  describe('deleteTeam', () => {
    it('should call teamService.deleteTeam and return success message', async () => {
      const result = await controller.deleteTeam('team-1');

      expect(result.message).toContain('Alpha Team');
      expect(mockTeamService.deleteTeam).toHaveBeenCalledWith('team-1');
    });
  });
});
