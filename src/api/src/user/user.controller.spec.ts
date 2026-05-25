import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { UserRole } from '../../generated/client';

describe('UserController', () => {
  let controller: UserController;

  const mockUser = {
    id: 'user-1',
    clerkId: 'clerk-1',
    name: 'Alice',
    email: 'alice@example.com',
    role: UserRole.VIEWER,
  };

  const mockUserWithRelations = {
    ...mockUser,
    teams: [],
    createdTasks: [],
    tasks: [],  // renamed from assignedTasks in schema
  };

  const mockUserService = {
    syncUserById: jest.fn().mockResolvedValue(mockUser),
    getUserWithRelations: jest.fn().mockResolvedValue(mockUserWithRelations),
    getUserById: jest.fn().mockResolvedValue(mockUser),
    updateUserRole: jest
      .fn()
      .mockResolvedValue({ ...mockUser, role: UserRole.ADMIN }),
    getUsersByRole: jest.fn().mockResolvedValue([mockUser]),
    deleteUser: jest.fn().mockResolvedValue({ message: 'User deleted from database' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should call userService.syncUserById with the current user clerkId', async () => {
      const fakeUser = { clerkId: 'clerk-1' };
      const result = await controller.getCurrentUser(fakeUser as any);

      expect(result).toEqual(mockUser);
      expect(mockUserService.syncUserById).toHaveBeenCalledWith('clerk-1');
    });
  });

  describe('getCurrentUserWithRelations', () => {
    it('should call userService.getUserWithRelations with the current user clerkId', async () => {
      const fakeUser = { clerkId: 'clerk-1' };
      const result = await controller.getCurrentUserWithRelations(fakeUser as any);

      expect(result).toEqual(mockUserWithRelations);
      expect(mockUserService.getUserWithRelations).toHaveBeenCalledWith('clerk-1');
    });
  });

  describe('getUserById', () => {
    it('should call userService.getUserById and return the user', async () => {
      const result = await controller.getUserById('user-1');

      expect(result).toEqual(mockUser);
      expect(mockUserService.getUserById).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getUserWithRelations', () => {
    it('should call userService.getUserWithRelations with the id param', async () => {
      const result = await controller.getUserWithRelations('user-1');

      expect(result).toEqual(mockUserWithRelations);
      expect(mockUserService.getUserWithRelations).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateUserRole', () => {
    it('should call userService.updateUserRole and return the updated user', async () => {
      const result = await controller.updateUserRole('user-1', UserRole.ADMIN);

      expect(result.role).toBe(UserRole.ADMIN);
      expect(mockUserService.updateUserRole).toHaveBeenCalledWith('user-1', UserRole.ADMIN);
    });
  });

  describe('getUsersByRole', () => {
    it('should call userService.getUsersByRole and return matching users', async () => {
      const result = await controller.getUsersByRole(UserRole.VIEWER);

      expect(result).toEqual([mockUser]);
      expect(mockUserService.getUsersByRole).toHaveBeenCalledWith(UserRole.VIEWER);
    });
  });

  describe('deleteUser', () => {
    it('should call userService.deleteUser and return success message', async () => {
      const result = await controller.deleteUser('user-1');

      expect(result).toEqual({ message: 'User deleted from database' });
      expect(mockUserService.deleteUser).toHaveBeenCalledWith('user-1');
    });
  });
});
