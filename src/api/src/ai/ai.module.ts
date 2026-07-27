import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { TeamMemberGuard } from '../guards/team-member.guard';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [AiController],
  providers: [AiService, TeamMemberGuard],
})
export class AiModule {}
