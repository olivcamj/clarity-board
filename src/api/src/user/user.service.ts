import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../../generated/client';
import { UserResponseDto } from './dto/user-response.dto';
import { createClerkClient } from '@clerk/backend';

// Type for normalized user data
interface NormalizedUserData {
  clerkId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

@Injectable()
export class UserService {
  private clerkClient;
  constructor(private readonly prisma: PrismaService) {
    this.clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }

  async getUserByClerkId(clerkId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (user && user.name) {
      return new UserResponseDto(user);
    }

    // No record yet, or a name-less record from an initial sync that never
    // got a follow-up webhook (e.g. Clerk can't reach a local dev server) —
    // fetch the current profile from Clerk directly rather than staying stale.
    console.log(
      user
        ? `⚠️ User ${clerkId} has no name on record, re-syncing from Clerk...`
        : `⚠️ User ${clerkId} not in database, syncing from Clerk...`,
    );
    return await this.syncUserById(clerkId);
  }

  /**
   * Sync user from webhook data
   * Called by webhook endpoint
   */
  async syncUserFromWebhook(webhookData: any): Promise<UserResponseDto> {
    const normalized = this.normalizeWebhookData(webhookData);
    return await this.upsertUser(normalized);
  }

  private async fetchClerkUser(clerkId: string): Promise<any> {
    try {
      console.log(`🔍 Fetching user ${clerkId} from Clerk API...`);
      const user = await this.clerkClient.users.getUser(clerkId);
      console.log('✅ Found user in Clerk');
      return user;
    } catch (error) {
      console.error('Failed to fetch user from Clerk API:', error);
      throw new NotFoundException(
        `User with Clerk ID ${clerkId} not found in Clerk`,
      );
    }
  }

  async syncUserById(clerkId: string): Promise<UserResponseDto> {
    const clerkUser = await this.fetchClerkUser(clerkId);
    const normalized = this.normalizeClerkApiData(clerkUser);
    return await this.upsertUser(normalized);
  }

  async updateUserRole(
    clerkId: string,
    role: UserRole,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { clerkId },
      data: { role },
    });

    return new UserResponseDto(user);
  }

  async getUsersByRole(role: UserRole): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => new UserResponseDto(user));
  }

  private normalizeWebhookData(data: any): NormalizedUserData {
    return {
      clerkId: data.id,
      firstName: data.first_name || null,
      lastName: data.last_name || null,
      email:
        data.email_addresses?.[0]?.email_address ||
        data.email_addresses?.[0]?.emailAddress ||
        null,
    };
  }

  private normalizeClerkApiData(clerkUser: any): NormalizedUserData {
    return {
      clerkId: clerkUser.id,
      firstName: clerkUser.firstName || null,
      lastName: clerkUser.lastName || null,
      email: clerkUser.emailAddresses[0]?.emailAddress || null,
    };
  }

  private buildFullName(
    firstName: string | null,
    lastName: string | null,
  ): string {
    if (!firstName) return '';
    return `${firstName} ${lastName || ''}`.trim();
  }

  private async handleEmailConflict(
    clerkId: string,
    email: string | null,
    fullName: string,
  ): Promise<UserResponseDto> {
    console.log(
      `⚠️ Email ${email} already exists, updating that user's clerkId`,
    );

    if (!email) {
      throw new ConflictException('Email conflict but email is null');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      throw new ConflictException('Email conflict but user not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        clerkId,
        name: fullName || existingUser.name,
        updatedAt: new Date(),
      },
    });

    console.log('✅ Updated existing user with new clerkId');
    return new UserResponseDto(updatedUser);
  }

  private async upsertUser(data: NormalizedUserData): Promise<UserResponseDto> {
    const { clerkId, email, firstName, lastName } = data;
    const fullName = this.buildFullName(firstName, lastName);

    console.log('📝 Upserting user:', { clerkId, fullName, email });

    try {
      const user = await this.prisma.user.upsert({
        where: { clerkId },
        update: {
          name: fullName,
          email: email ?? '',
          updatedAt: new Date(),
        },
        create: {
          clerkId,
          name: fullName,
          email: email ?? '',
          role: UserRole.EDITOR,
        },
      });

      console.log('✅ User upserted successfully:', user.id);
      return new UserResponseDto(user);
    } catch (error) {
      // Handle unique constraint violation on email
      if (
        typeof error === 'object' &&
        error != null &&
        'code' in error &&
        'meta' in error
      ) {
        if (
          error.code === 'P2002' &&
          (error as { meta: { target?: unknown[] } })?.meta?.target?.includes(
            'email',
          )
        ) {
          return await this.handleEmailConflict(clerkId, email, fullName);
        }
      }
      throw error;
    }
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return new UserResponseDto(user);
  }

  async getUserWithRelations(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      include: {
        memberships: {
          include: { team: true },
        },
        createdTasks: {
          include: { board: true },
        },
        tasks: {
          include: { board: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${clerkId} not found`);
    }

    // Reshape memberships → teams for the frontend's BackendUser shape
    return {
      ...user,
      teams: user.memberships.map((membership) => ({
        id: membership.team.id,
        name: membership.team.name,
        role: membership.role,
        workspaceId: membership.team.workspaceId ?? null,
      })),
    };
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted from database' };
  }
}
