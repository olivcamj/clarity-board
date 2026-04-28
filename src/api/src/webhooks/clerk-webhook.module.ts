import { Module } from '@nestjs/common';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { UserModule } from '../user/user.module';
// import { UserService } from '../user/user.service';

@Module({
  imports: [UserModule], // Need UserService to sync users
  controllers: [ClerkWebhookController],
  // providers: [UserService],
})
export class ClerkWebhookModule {}
