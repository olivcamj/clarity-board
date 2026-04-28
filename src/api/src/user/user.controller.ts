import {
  Controller,
  Get,
  Delete,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { UserRole } from '../../generated/client';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
@UseGuards(ClerkAuthGuard, RolesGuard)
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
  async getCurrentUser(@CurrentUser() user: any) {
    return await this.userService.syncUserById(user.clerkId);
  }

  /**
   * GET /api/users/me/full
   * Get current user with all their teams and tasks
   *
   * USAGE: For a dashboard showing everything user is involved in
   */
  @Get('me/full')
  async getCurrentUserWithRelations(@CurrentUser() user: any) {
    return this.userService.getUserWithRelations(user.clerkId);
  }

  /**
   * GET /api/users/:id
   * Get specific user by their database ID
   *
   * USAGE: Viewing someone else's profile, getting task creator info
   */
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return await this.userService.getUserById(id);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Get(':id/full')
  async getUserWithRelations(@Param('id') id: string) {
    return await this.userService.getUserWithRelations(id);
  }

  @Roles(UserRole.ADMIN)
  @Put(':id/role')
  async updateUserRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return await this.userService.updateUserRole(id, role);
  }

  @Roles(UserRole.ADMIN)
  @Get('role/:role')
  async getUsersByRole(@Param('role') role: UserRole) {
    return await this.userService.getUsersByRole(role);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
