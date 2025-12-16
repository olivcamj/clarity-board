import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PromptsModule } from './prompts/prompts.module';
import { UserModule } from './user/user.module';
import { ClerkWebhookModule } from './webhooks/clerk-webhook.module';
import { TeamModule } from './team/team.module';

@Module({
  imports: [PromptsModule, UserModule, ClerkWebhookModule, TeamModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
