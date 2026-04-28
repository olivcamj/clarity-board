import { Test, TestingModule } from '@nestjs/testing';
import { UserService, UserWithRelations } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  const mockUser: UserWithRelations = {
    id: '123',
    clerkId: 'clerk_123',
    name: 'Alice',
    email: 'alice@example.com',
    role: 'editor',
    createdAt: new Date(),
    teams: [],
    createdTasks: [],
    assignedTasks: [],
  };

  const mockPrismaService = {
    user: {
      create: jest.fn().mockResolvedValue(mockUser),
      findMany: jest.fn().mockResolvedValue([mockUser]),
      findUnique: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue({ ...mockUser, name: 'Updated' }),
      delete: jest.fn().mockResolvedValue(mockUser),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a user', async () => {
    const dto = {
      name: 'Alice',
      email: 'alice@example.com',
      role: 'editor',
      clerkId: 'clerk_123',
    };
    const user = await service.create(dto);
    expect(user).toEqual(mockUser);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: dto,
      include: expect.any(Object),
    });
  });

  it('should return all users', async () => {
    const users = await service.findAll();
    expect(users).toEqual([mockUser]);
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it('should return one user by id', async () => {
    const user = await service.findOne('123');
    expect(user).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: '123' },
      include: expect.any(Object),
    });
  });

  it('should throw NotFoundException if user not found', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);
    await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
  });

  it('should update a user', async () => {
    const user = await service.update('123', { name: 'Updated' });
    expect(user.name).toBe('Updated');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: '123' },
      data: { name: 'Updated' },
      include: expect.any(Object),
    });
  });

  it('should delete a user', async () => {
    const user = await service.delete('123');
    expect(user).toEqual(mockUser);
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: '123' },
      include: expect.any(Object),
    });
  });
});
