import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PromptsModule } from './prompts/prompts.module';
import { UserModule } from './user/user.module';
import { ClerkWebhookModule } from './webhooks/clerk-webhook.module';
import { TeamModule } from './team/team.module';
import { BoardModule } from './board/board.module';
import { TaskModule } from './task/task.module';
import { WorkspaceModule } from './workspace/workspace.module';

@Module({
  imports: [
    PromptsModule,
    UserModule,
    ClerkWebhookModule,
    TeamModule,
    BoardModule,
    TaskModule,
    WorkspaceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
