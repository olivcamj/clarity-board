import { Test, TestingModule } from '@nestjs/testing';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

describe('TeamController', () => {
  let controller: TeamController;

  const mockTeam = {
    id: 'team-1',
    name: 'Alpha Team',
    userCount: 1,
    boardCount: 0,
  };

  const mockTeamWithUsers = {
    id: 'team-1',
    name: 'Alpha Team',
    users: [
      {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'ADMIN',
      },
    ],
  };

  const mockTeamService = {
    createTeam: jest.fn().mockResolvedValue(mockTeam),
    getTeams: jest.fn().mockResolvedValue([mockTeam]),
    addUserToTeam: jest.fn().mockResolvedValue(mockTeamWithUsers),
    removeUserFromTeam: jest.fn().mockResolvedValue(mockTeamWithUsers),
    deleteTeam: jest
      .fn()
      .mockResolvedValue({ message: 'Team "Alpha Team" deleted successfully' }),
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
      .compile();

    controller = module.get<TeamController>(TeamController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTeam', () => {
    it('should call teamService.createTeam with dto and user.userId', async () => {
      const dto = { name: 'Alpha Team', userIds: [] };
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
    it('should call teamService.addUserToTeam and return the updated team', async () => {
      const result = await controller.addUser('team-1', 'user-2');

      expect(result).toEqual(mockTeamWithUsers);
      expect(mockTeamService.addUserToTeam).toHaveBeenCalledWith(
        'team-1',
        'user-2',
      );
    });
  });

  describe('removeUser', () => {
    it('should call teamService.removeUserFromTeam and return the updated team', async () => {
      const result = await controller.removeUser('team-1', 'user-2');

      expect(result).toEqual(mockTeamWithUsers);
      expect(mockTeamService.removeUserFromTeam).toHaveBeenCalledWith(
        'team-1',
        'user-2',
      );
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
