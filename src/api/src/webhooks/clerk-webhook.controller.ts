import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { Webhook } from 'svix';

@Controller('api/webhooks')
export class ClerkWebhookController {
  constructor(private usersService: UserService) {}

  @Post('clerk')
  @HttpCode(200)
  async handleClerkWebhook(
    @Body() payload: any,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ CLERK_WEBHOOK_SECRET is not set in .env');
      throw new Error('Webhook secret not configured');
    }

    const webhook = new Webhook(webhookSecret);
    let evt: any;

    try {
      // This verifies the signature matches the payload
      evt = webhook.verify(JSON.stringify(payload), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      console.error('❌ Webhook verification failed:', err);
      return { error: 'Invalid signature' };
    }

    const eventType = evt.type;
    const userId = evt.data.id; // Clerk user ID
    const webhookData = evt.data;

    console.log(`📬 Received webhook: ${eventType} for user ${userId}`);

    try {
      if (eventType === 'user.created' || eventType === 'user.updated') {
        // User signed up or updated profile → Sync to our DB
        await this.usersService.syncUserFromWebhook(webhookData);
        console.log(`✅ User ${userId} synced to database`);
      }

      if (eventType === 'user.deleted') {
        // User deleted from Clerk → Delete from our DB
        const user = await this.usersService.getUserByClerkId(userId);
        await this.usersService.deleteUser(user.id);
        console.log(`🗑️ User ${userId} deleted from database`);
      }
    } catch (error) {
      console.error(`❌ Error processing webhook:`, error);
      // Return 200 anyway so Clerk doesn't retry
      // Log the error for debugging
    }

    return { received: true };
  }
}
