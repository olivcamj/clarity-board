import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { UserService } from '../user/user.service';
import { verifyToken } from '@clerk/backend';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
  createClerkClient: jest
    .fn()
    .mockReturnValue({ users: { getUser: jest.fn() } }),
}));

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;
  let mockUserService: Partial<UserService>;

  const mockDbUser = { id: 'user-1', clerkId: 'clerk-1', role: 'EDITOR' };

  const makeContext = (authHeader?: string): ExecutionContext => {
    const request: any = {
      headers: authHeader ? { authorization: authHeader } : {},
      auth: undefined,
      user: undefined,
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    mockUserService = {
      getUserByClerkId: jest.fn().mockResolvedValue(mockDbUser),
    };
    guard = new ClerkAuthGuard(mockUserService as UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true and populate request.auth when token is valid', async () => {
      (verifyToken as jest.Mock).mockResolvedValue({
        sub: 'clerk-1',
        sid: 'session-1',
      });
      const ctx = makeContext('Bearer valid-token');
      const request = ctx.switchToHttp().getRequest();

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(request.auth).toEqual({
        clerkId: 'clerk-1',
        userId: 'user-1',
        sessionId: 'session-1',
      });
      expect(request.user).toEqual(mockDbUser);
      expect(mockUserService.getUserByClerkId).toHaveBeenCalledWith('clerk-1');
    });

    it('should throw UnauthorizedException when no authorization header is present', async () => {
      await expect(guard.canActivate(makeContext())).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when scheme is not Bearer', async () => {
      await expect(
        guard.canActivate(makeContext('Basic some-token')),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      (verifyToken as jest.Mock).mockRejectedValue(new Error('invalid token'));

      await expect(
        guard.canActivate(makeContext('Bearer bad-token')),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
