import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { TeamMemberGuard } from '../guards/team-member.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [PrismaModule, UserModule, WorkspaceModule],
  providers: [TeamService, ClerkAuthGuard, TeamMemberGuard],
  controllers: [TeamController],
  exports: [TeamService],
})
export class TeamModule {}
