import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TeamMemberGuard } from '../guards/team-member.guard';
import { UserModule } from '../user/user.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [UserModule, RealtimeModule],
  controllers: [TaskController],
  providers: [TaskService, TeamMemberGuard],
  exports: [TaskService],
})
export class TaskModule {}
