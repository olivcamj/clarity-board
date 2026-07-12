import { verifyToken } from '@clerk/backend';
import { RealtimeGateway } from './realtime.gateway';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let mockUserService: Partial<UserService>;
  let mockPrisma: any;
  let mockServer: any;

  const mockDbUser = { id: 'user-1', name: 'Alice' };

  const makeSocket = (overrides: Record<string, any> = {}): any => ({
    handshake: { auth: {} },
    data: {},
    join: jest.fn(),
    leave: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    mockUserService = {
      getUserByClerkId: jest.fn().mockResolvedValue(mockDbUser),
    };
    mockPrisma = {
      board: { findUnique: jest.fn().mockResolvedValue({ teamId: 'team-1' }) },
      teamMembership: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ userId: 'user-1', teamId: 'team-1' }),
      },
    };
    mockServer = {
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
      sockets: {
        adapter: { rooms: new Map() },
        sockets: new Map(),
      },
    };

    gateway = new RealtimeGateway(
      mockUserService as UserService,
      mockPrisma as PrismaService,
    );
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('authMiddleware', () => {
    const runMiddleware = (socket: any) => {
      const next = jest.fn();
      return (gateway as any).authMiddleware(socket, next).then(() => next);
    };

    it('populates socket.data.user and calls next() for a valid token', async () => {
      (verifyToken as jest.Mock).mockResolvedValue({ sub: 'clerk-1' });
      const socket = makeSocket({
        handshake: { auth: { token: 'good-token' } },
      });

      const next = await runMiddleware(socket);

      expect(next).toHaveBeenCalledWith();
      expect(socket.data.user).toEqual({ id: 'user-1', name: 'Alice' });
      expect(socket.data.boardIds).toBeInstanceOf(Set);
      expect(mockUserService.getUserByClerkId).toHaveBeenCalledWith('clerk-1');
    });

    it('calls next(Error) when no token is present', async () => {
      const socket = makeSocket({ handshake: { auth: {} } });

      const next = await runMiddleware(socket);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(socket.data.user).toBeUndefined();
    });

    it('calls next(Error) when token verification fails', async () => {
      (verifyToken as jest.Mock).mockRejectedValue(new Error('bad token'));
      const socket = makeSocket({
        handshake: { auth: { token: 'bad-token' } },
      });

      const next = await runMiddleware(socket);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('handleJoinBoard', () => {
    it('joins the room and broadcasts presence for a team member', async () => {
      const socket = makeSocket({
        data: { user: mockDbUser, boardIds: new Set<string>() },
      });

      await gateway.handleJoinBoard(socket, { boardId: 'board-1' });

      expect(socket.join).toHaveBeenCalledWith('board:board-1');
      expect(socket.data.boardIds.has('board-1')).toBe(true);
      expect(mockServer.to).toHaveBeenCalledWith('board:board-1');
    });

    it('does not join and does not broadcast when the user is not a team member', async () => {
      mockPrisma.teamMembership.findUnique.mockResolvedValueOnce(null);
      const socket = makeSocket({
        data: { user: mockDbUser, boardIds: new Set<string>() },
      });

      await gateway.handleJoinBoard(socket, { boardId: 'board-1' });

      expect(socket.join).not.toHaveBeenCalled();
      expect(socket.data.boardIds.has('board-1')).toBe(false);
      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it('is idempotent for a duplicate join on an already-joined board', async () => {
      const socket = makeSocket({
        data: { user: mockDbUser, boardIds: new Set(['board-1']) },
      });

      await gateway.handleJoinBoard(socket, { boardId: 'board-1' });

      expect(mockPrisma.board.findUnique).not.toHaveBeenCalled();
      expect(socket.join).not.toHaveBeenCalled();
    });

    it('does nothing if the socket has no authenticated user (auth middleware did not run)', async () => {
      const socket = makeSocket({ data: { boardIds: new Set<string>() } });

      await gateway.handleJoinBoard(socket, { boardId: 'board-1' });

      expect(mockPrisma.board.findUnique).not.toHaveBeenCalled();
      expect(socket.join).not.toHaveBeenCalled();
    });
  });

  describe('handleLeaveBoard', () => {
    it('leaves the room and broadcasts presence for a joined board', () => {
      const socket = makeSocket({
        data: { user: mockDbUser, boardIds: new Set(['board-1']) },
      });

      gateway.handleLeaveBoard(socket, { boardId: 'board-1' });

      expect(socket.leave).toHaveBeenCalledWith('board:board-1');
      expect(socket.data.boardIds.has('board-1')).toBe(false);
      expect(mockServer.to).toHaveBeenCalledWith('board:board-1');
    });

    it('is a no-op for a board never joined', () => {
      const socket = makeSocket({
        data: { user: mockDbUser, boardIds: new Set<string>() },
      });

      gateway.handleLeaveBoard(socket, { boardId: 'board-1' });

      expect(socket.leave).not.toHaveBeenCalled();
      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('broadcasts presence once per board the socket had joined', () => {
      const socket = makeSocket({
        data: { user: mockDbUser, boardIds: new Set(['board-1', 'board-2']) },
      });

      gateway.handleDisconnect(socket);

      expect(mockServer.to).toHaveBeenCalledWith('board:board-1');
      expect(mockServer.to).toHaveBeenCalledWith('board:board-2');
      expect(mockServer.to).toHaveBeenCalledTimes(2);
    });

    it('does nothing when the socket never joined a board', () => {
      const socket = makeSocket({ data: {} });

      gateway.handleDisconnect(socket);

      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  describe('presence de-duplication', () => {
    it('collapses multiple sockets for the same user into one presence entry', async () => {
      const emit = jest.fn();
      mockServer.to.mockReturnValue({ emit });
      mockServer.sockets.adapter.rooms.set(
        'board:board-1',
        new Set(['socket-a', 'socket-b']),
      );
      mockServer.sockets.sockets.set('socket-a', {
        data: { user: { id: 'user-1', name: 'Alice' } },
      });
      mockServer.sockets.sockets.set('socket-b', {
        data: { user: { id: 'user-1', name: 'Alice' } },
      });

      const socket = makeSocket({
        data: { user: mockDbUser, boardIds: new Set<string>() },
      });
      await gateway.handleJoinBoard(socket, { boardId: 'board-1' });

      expect(emit).toHaveBeenCalledWith('presence:update', {
        boardId: 'board-1',
        users: [{ id: 'user-1', name: 'Alice' }],
      });
    });
  });

  describe('broadcastTaskCreated / broadcastTaskUpdated / broadcastTaskDeleted', () => {
    it('emits to the board room with the payload unchanged', () => {
      const emit = jest.fn();
      mockServer.to.mockReturnValue({ emit });
      const task = { id: 'task-1', boardId: 'board-1', status: 'todo' } as any;

      gateway.broadcastTaskCreated('board-1', task);
      gateway.broadcastTaskUpdated('board-1', task);
      gateway.broadcastTaskDeleted('board-1', { id: 'task-1' });

      expect(mockServer.to).toHaveBeenCalledWith('board:board-1');
      expect(emit).toHaveBeenNthCalledWith(1, 'task:created', task);
      expect(emit).toHaveBeenNthCalledWith(2, 'task:updated', task);
      expect(emit).toHaveBeenNthCalledWith(3, 'task:deleted', { id: 'task-1' });
    });
  });
});
