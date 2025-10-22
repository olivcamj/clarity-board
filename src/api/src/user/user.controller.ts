import { Controller, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';

@UseGuards(ClerkAuthGuard)
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * GET /api/users/me
   * Get current logged-in user's profile
   *
   * USAGE: Call this when user first loads your app to get their data
   */
  @Get('me')
  async getCurrentUser(@Req() req: any) {
    // Clerk middleware adds auth info to request
    const clerkId = req.auth.userId; // This is the Clerk user ID
    return await this.userService.syncUserById(clerkId);
  }

  /**
   * GET /api/users/me/full
   * Get current user with all their teams and tasks
   *
   * USAGE: For a dashboard showing everything user is involved in
   */
  @Get('me/full')
  async getCurrentUserWithRelations(@Req() req: any) {
    const clerkId = req.auth.userId;
    const user = await this.userService.getUserByClerkId(clerkId);
    return this.userService.getUserWithRelations(user.id);
  }

  /**
   * GET /api/users/:id
   * Get specific user by their database ID
   *
   * USAGE: Viewing someone else's profile, getting task creator info
   */
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return await this.userService.getUserById(id);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
