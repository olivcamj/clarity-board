import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { verifyToken } from '@clerk/backend';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { TaskResponseDto } from '../task/dto/task-response.dto';
import type {
  JoinBoardPayload,
  JoinTeamPayload,
  LeaveBoardPayload,
  LeaveTeamPayload,
  PresenceUser,
  SocketData,
  TaskDeletedPayload,
  TeamMemberDto,
} from './types';

type AppSocket = Socket & { data: SocketData };

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server): void {
    server.use(this.authMiddleware);
  }

  // Arrow class field (not a method) so `this` is bound correctly when
  // passed as a bare reference to `server.use`.
  private authMiddleware = async (
    socket: AppSocket,
    next: (err?: Error) => void,
  ): Promise<void> => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('Unauthorized'));
      return;
    }

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      const dbUser = await this.userService.getUserByClerkId(payload.sub);
      socket.data.user = { id: dbUser.id, name: dbUser.name ?? '' };
      socket.data.boardIds = new Set<string>();
      socket.data.teamIds = new Set<string>();
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  };

  @SubscribeMessage('join-board')
  async handleJoinBoard(
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() payload: JoinBoardPayload,
  ): Promise<void> {
    const user = socket.data.user;
    const boardId = payload?.boardId;
    const boardIds = socket.data.boardIds;
    if (!user || !boardId || !boardIds) return;

    // Idempotent: React StrictMode double-invokes effects in dev, so the
    // client may emit join-board twice for the same board.
    if (boardIds.has(boardId)) return;

    const allowed = await this.isTeamMember(user.id, boardId);
    if (!allowed) return; // silent refusal no error event in the contract

    await socket.join(this.room(boardId));
    boardIds.add(boardId);
    this.broadcastPresence(boardId);
  }

  @SubscribeMessage('leave-board')
  handleLeaveBoard(
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() payload: LeaveBoardPayload,
  ): void {
    const boardId = payload?.boardId;
    const boardIds = socket.data.boardIds;
    if (!boardId || !boardIds?.has(boardId)) return;

    socket.leave(this.room(boardId));
    boardIds.delete(boardId);
    this.broadcastPresence(boardId);
  }

  @SubscribeMessage('join-team')
  async handleJoinTeam(
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() payload: JoinTeamPayload,
  ): Promise<void> {
    const user = socket.data.user;
    const teamId = payload?.teamId;
    const teamIds = socket.data.teamIds;
    if (!user || !teamId || !teamIds) return;

    // Idempotent for the same reason join-board is: StrictMode double-invokes
    // effects in dev, so the client may emit join-team twice for the same team.
    if (teamIds.has(teamId)) return;

    const allowed = await this.isMemberOfTeam(user.id, teamId);
    if (!allowed) return; // silent refusal no error event in the contract

    await socket.join(this.teamRoom(teamId));
    teamIds.add(teamId);
  }

  @SubscribeMessage('leave-team')
  handleLeaveTeam(
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() payload: LeaveTeamPayload,
  ): void {
    const teamId = payload?.teamId;
    const teamIds = socket.data.teamIds;
    if (!teamId || !teamIds?.has(teamId)) return;

    socket.leave(this.teamRoom(teamId));
    teamIds.delete(teamId);
  }

  handleDisconnect(socket: AppSocket): void {
    const boardIds = socket.data.boardIds;
    if (!boardIds) return;
    // Socket.io removes a closing socket from all its rooms (leaveAll())
    // before firing 'disconnect', so getPresenceUsers already excludes it —
    // we just need to know which boards to re-broadcast for.
    for (const boardId of boardIds) {
      this.broadcastPresence(boardId);
    }
  }

  broadcastTaskCreated(boardId: string, task: TaskResponseDto): void {
    this.server.to(this.room(boardId)).emit('task:created', task);
  }

  broadcastTaskUpdated(boardId: string, task: TaskResponseDto): void {
    this.server.to(this.room(boardId)).emit('task:updated', task);
  }

  broadcastTaskDeleted(boardId: string, payload: TaskDeletedPayload): void {
    this.server.to(this.room(boardId)).emit('task:deleted', payload);
  }

  broadcastMemberJoined(teamId: string, member: TeamMemberDto): void {
    this.server
      .to(this.teamRoom(teamId))
      .emit('member:joined', { teamId, member });
  }

  private room(boardId: string): string {
    return `board:${boardId}`;
  }

  private teamRoom(teamId: string): string {
    return `team:${teamId}`;
  }

  private async isMemberOfTeam(
    userId: string,
    teamId: string,
  ): Promise<boolean> {
    const membership = await this.prisma.teamMembership.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    return !!membership;
  }

  private async isTeamMember(
    userId: string,
    boardId: string,
  ): Promise<boolean> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { teamId: true },
    });
    if (!board) return false;

    const membership = await this.prisma.teamMembership.findUnique({
      where: { userId_teamId: { userId, teamId: board.teamId } },
    });
    return !!membership;
  }

  private getPresenceUsers(boardId: string): PresenceUser[] {
    const socketIds =
      this.server.sockets.adapter.rooms.get(this.room(boardId)) ??
      new Set<string>();
    const byUserId = new Map<string, PresenceUser>();
    for (const socketId of socketIds) {
      const memberSocket = this.server.sockets.sockets.get(socketId) as
        | AppSocket
        | undefined;
      const user = memberSocket?.data?.user;
      if (user) byUserId.set(user.id, user);
    }
    return [...byUserId.values()];
  }

  private broadcastPresence(boardId: string): void {
    this.server.to(this.room(boardId)).emit('presence:update', {
      boardId,
      users: this.getPresenceUsers(boardId),
    });
  }
}
