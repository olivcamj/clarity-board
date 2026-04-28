import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PrismaModule, UserModule],
  providers: [TeamService, ClerkAuthGuard],
  controllers: [TeamController],
  exports: [TeamService],
})
export class TeamModule {}
