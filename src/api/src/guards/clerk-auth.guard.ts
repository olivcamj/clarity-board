import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { Request as ExpressRequest } from 'express';
import { UserService } from '../user/user.service';
import { UserResponseDto } from '../user/dto/user-response.dto';

interface RequestWithAuth extends ExpressRequest {
  auth?: {
    clerkId: string;
    userId: string;
    sessionId: string;
  };
  user?: UserResponseDto;
  headers: {
    authorization?: string;
    [key: string]: any;
  };
}
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      // Verify token with Clerk
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      const clerkId = payload.sub; // The user ID is stored in the `sub` claim

      const dbUser = await this.userService.getUserByClerkId(clerkId);

      // request.auth — read by @CurrentUser() decorator
      request.auth = {
        clerkId,
        userId: dbUser.id,
        sessionId: payload.sid,
      };

      // request.user — read by RolesGuard
      request.user = dbUser;

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
