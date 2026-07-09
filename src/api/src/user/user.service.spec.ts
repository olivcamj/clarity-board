import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { UserRole } from '../../generated/client';
import { createClerkClient } from '@clerk/backend';

jest.mock('@clerk/backend', () => ({
  createClerkClient: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;

  const mockDbUser = {
    id: 'user-1',
    clerkId: 'clerk-1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    role: UserRole.VIEWER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockClerkUser = {
    id: 'clerk-1',
    firstName: 'Alice',
    lastName: 'Smith',
    emailAddresses: [{ emailAddress: 'alice@example.com' }],
  };

  const mockGetUser = jest.fn();

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    (createClerkClient as jest.Mock).mockReturnValue({
      users: { getUser: mockGetUser },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserByClerkId', () => {
    it('should return the user from DB when found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockDbUser);

      const result = await service.getUserByClerkId('clerk-1');

      expect(result.id).toBe('user-1');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'clerk-1' },
      });
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it('should sync from Clerk when user is not in DB', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockGetUser.mockResolvedValue(mockClerkUser);
      mockPrismaService.user.upsert.mockResolvedValue(mockDbUser);

      const result = await service.getUserByClerkId('clerk-1');

      expect(result.id).toBe('user-1');
      expect(mockGetUser).toHaveBeenCalledWith('clerk-1');
    });
  });

  describe('syncUserFromWebhook', () => {
    it('should normalize webhook data and upsert the user', async () => {
      const webhookData = {
        id: 'clerk-1',
        first_name: 'Alice',
        last_name: 'Smith',
        email_addresses: [{ email_address: 'alice@example.com' }],
      };
      mockPrismaService.user.upsert.mockResolvedValue(mockDbUser);

      const result = await service.syncUserFromWebhook(webhookData);

      expect(result.id).toBe('user-1');
      expect(mockPrismaService.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clerkId: 'clerk-1' },
          create: expect.objectContaining({
            clerkId: 'clerk-1',
            name: 'Alice Smith',
            email: 'alice@example.com',
          }),
        }),
      );
    });
  });

  describe('syncUserById', () => {
    it('should fetch from Clerk and upsert the user', async () => {
      mockGetUser.mockResolvedValue(mockClerkUser);
      mockPrismaService.user.upsert.mockResolvedValue(mockDbUser);

      const result = await service.syncUserById('clerk-1');

      expect(result.id).toBe('user-1');
      expect(mockGetUser).toHaveBeenCalledWith('clerk-1');
      expect(mockPrismaService.user.upsert).toHaveBeenCalled();
    });

    it('should throw NotFoundException when Clerk user does not exist', async () => {
      mockGetUser.mockRejectedValue(new Error('Not found in Clerk'));

      await expect(service.syncUserById('bad-clerk-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUserRole', () => {
    it('should update and return the user with the new role', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockDbUser,
        role: UserRole.ADMIN,
      });

      const result = await service.updateUserRole('clerk-1', UserRole.ADMIN);

      expect(result.role).toBe(UserRole.ADMIN);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { clerkId: 'clerk-1' },
        data: { role: UserRole.ADMIN },
      });
    });
  });

  describe('getUsersByRole', () => {
    it('should return all users with the given role', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockDbUser]);

      const result = await service.getUsersByRole(UserRole.VIEWER);

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe(UserRole.VIEWER);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { role: UserRole.VIEWER },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getUserById', () => {
    it('should return user when found by DB id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockDbUser);

      const result = await service.getUserById('user-1');

      expect(result.id).toBe('user-1');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should throw NotFoundException when user not found by DB id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserWithRelations', () => {
    it('should return user with teams (via memberships) and tasks', async () => {
      const membership = {
        role: 'EDITOR',
        team: { id: 'team-1', name: 'Alpha Team' },
      };
      const userWithRelations = {
        ...mockDbUser,
        memberships: [membership],
        createdTasks: [],
        tasks: [],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithRelations);

      const result = await service.getUserWithRelations('clerk-1');

      expect(result.teams).toEqual([
        { id: 'team-1', name: 'Alpha Team', role: 'EDITOR' },
      ]);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clerkId: 'clerk-1' },
          include: expect.objectContaining({ memberships: expect.any(Object) }),
        }),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserWithRelations('bad-clerk-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete the user and return a success message', async () => {
      mockPrismaService.user.delete.mockResolvedValue(mockDbUser);

      const result = await service.deleteUser('user-1');

      expect(result).toEqual({ message: 'User deleted from database' });
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });
  });
});
