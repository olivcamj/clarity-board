import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TeamMemberGuard } from './team-member.guard';
import { PrismaService } from '../prisma/prisma.service';
import { MemberRole } from '../../generated/client';
import { TEAM_ROLES_KEY } from '../common/decorators/team-roles.decorator';
import { RESOURCE_TYPE_KEY } from '../common/decorators/resource-type.decorator';

describe('TeamMemberGuard', () => {
  let guard: TeamMemberGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let mockPrisma: { board: any; task: any; teamMembership: any };

  const makeContext = (
    user: any,
    params: Record<string, string> = {},
    body: Record<string, any> = {},
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params, body }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    mockPrisma = {
      board: { findUnique: jest.fn() },
      task: { findUnique: jest.fn() },
      teamMembership: { findUnique: jest.fn() },
    };
    guard = new TeamMemberGuard(
      reflector as unknown as Reflector,
      mockPrisma as unknown as PrismaService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('when no team roles are required', () => {
    it('should return true and skip all checks', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(undefined); // no required roles
      const ctx = makeContext({ id: 'user-1' });

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(mockPrisma.teamMembership.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when team roles are required', () => {
    const editorRoles = [MemberRole.EDITOR, MemberRole.ADMIN];

    beforeEach(() => {
      // First call = required roles, second call = resource type
      reflector.getAllAndOverride
        .mockReturnValueOnce(editorRoles)
        .mockReturnValueOnce('team');
    });

    it('should throw ForbiddenException when request has no user', async () => {
      const ctx = makeContext(null, { teamId: 'team-1' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when the user has no membership', async () => {
      mockPrisma.teamMembership.findUnique.mockResolvedValue(null);
      const ctx = makeContext({ id: 'user-1' }, { teamId: 'team-1' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when membership role is insufficient', async () => {
      mockPrisma.teamMembership.findUnique.mockResolvedValue({
        role: MemberRole.VIEWER,
      });
      const ctx = makeContext({ id: 'user-1' }, { teamId: 'team-1' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('should return true when the user has a sufficient role', async () => {
      mockPrisma.teamMembership.findUnique.mockResolvedValue({
        role: MemberRole.EDITOR,
      });
      const ctx = makeContext({ id: 'user-1' }, { teamId: 'team-1' });
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });
  });

  describe('teamId resolution', () => {
    beforeEach(() => {
      mockPrisma.teamMembership.findUnique.mockResolvedValue({
        role: MemberRole.ADMIN,
      });
    });

    it('should resolve teamId directly from params for resource type "team"', async () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce([MemberRole.ADMIN])
        .mockReturnValueOnce('team');

      const ctx = makeContext({ id: 'user-1' }, { teamId: 'team-1' });
      await guard.canActivate(ctx);

      expect(mockPrisma.teamMembership.findUnique).toHaveBeenCalledWith({
        where: { userId_teamId: { userId: 'user-1', teamId: 'team-1' } },
      });
    });

    it('should resolve teamId via board lookup for resource type "board"', async () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce([MemberRole.EDITOR, MemberRole.ADMIN])
        .mockReturnValueOnce('board');
      mockPrisma.board.findUnique.mockResolvedValue({ teamId: 'team-1' });

      const ctx = makeContext({ id: 'user-1' }, { id: 'board-1' });
      await guard.canActivate(ctx);

      expect(mockPrisma.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        select: { teamId: true },
      });
      expect(mockPrisma.teamMembership.findUnique).toHaveBeenCalledWith({
        where: { userId_teamId: { userId: 'user-1', teamId: 'team-1' } },
      });
    });

    it('should resolve teamId from body when creating a board (no boardId param)', async () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce([MemberRole.EDITOR, MemberRole.ADMIN])
        .mockReturnValueOnce('board');

      const ctx = makeContext({ id: 'user-1' }, {}, { teamId: 'team-1' });
      await guard.canActivate(ctx);

      expect(mockPrisma.board.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.teamMembership.findUnique).toHaveBeenCalledWith({
        where: { userId_teamId: { userId: 'user-1', teamId: 'team-1' } },
      });
    });

    it('should resolve teamId via task→board lookup for resource type "task"', async () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce([MemberRole.EDITOR, MemberRole.ADMIN])
        .mockReturnValueOnce('task');
      mockPrisma.task.findUnique.mockResolvedValue({
        board: { teamId: 'team-1' },
      });

      const ctx = makeContext({ id: 'user-1' }, { id: 'task-1' });
      await guard.canActivate(ctx);

      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        select: { board: { select: { teamId: true } } },
      });
      expect(mockPrisma.teamMembership.findUnique).toHaveBeenCalledWith({
        where: { userId_teamId: { userId: 'user-1', teamId: 'team-1' } },
      });
    });

    it('should throw ForbiddenException when teamId cannot be resolved', async () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce([MemberRole.EDITOR])
        .mockReturnValueOnce('board');
      mockPrisma.board.findUnique.mockResolvedValue(null);

      const ctx = makeContext({ id: 'user-1' }, { id: 'missing-board' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });
});
