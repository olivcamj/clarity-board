import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { TeamMemberGuard } from '../guards/team-member.guard';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [BoardService, TeamMemberGuard],
  controllers: [BoardController],
})
export class BoardModule {}
