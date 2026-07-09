import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../generated/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;

  const makeContext = (user: any): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required (undefined)', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      expect(guard.canActivate(makeContext({ role: UserRole.VIEWER }))).toBe(true);
    });

    it('should return true when required roles array is empty', () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      expect(guard.canActivate(makeContext({ role: UserRole.VIEWER }))).toBe(true);
    });

    it('should return true when user has the required role', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      expect(guard.canActivate(makeContext({ role: UserRole.ADMIN }))).toBe(true);
    });

    it('should return true when user has one of multiple required roles', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN, UserRole.EDITOR]);
      expect(guard.canActivate(makeContext({ role: UserRole.EDITOR }))).toBe(true);
    });

    it('should throw ForbiddenException when user lacks the required role', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      expect(() => guard.canActivate(makeContext({ role: UserRole.VIEWER }))).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when request has no user', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      expect(() => guard.canActivate(makeContext(null))).toThrow(ForbiddenException);
    });
  });
});
