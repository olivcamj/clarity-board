import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WorkspaceService } from './workspace.service';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@UseGuards(ClerkAuthGuard, RolesGuard)
@Controller('api/workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get('mine')
  getMyWorkspaces(@CurrentUser() user: any) {
    return this.workspaceService.getMyWorkspaces(user.userId);
  }

  @Patch(':id')
  renameWorkspace(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.renameWorkspace(id, user.userId, dto.name);
  }
}
