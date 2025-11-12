import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { Request as ExpressRequest } from 'express';
import { PrismaService } from '../prisma/prisma.service';

interface RequestWithAuth extends ExpressRequest {
  auth?: {
    userId: string;
    sessionId: string;
  };
  user?: any;
  headers: {
    authorization?: string;
    [key: string]: any;
  };
}
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      // Verify token with Clerk
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      // Add user info to request object
      // This is where `req.auth` will be populated
      request.auth = {
        userId: payload.sub, // The user ID is stored in the `sub` claim
        sessionId: payload.sid,
      };

      const user = await this.prisma.user.findUnique({
        where: { clerkId: payload.sub },
        select: {
          id: true,
          clerkId: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found in database.');
      }

      request.user = user;

      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: RequestWithAuth): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
