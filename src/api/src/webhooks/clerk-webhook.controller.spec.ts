import { Test, TestingModule } from '@nestjs/testing';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { UserService } from '../user/user.service';
import { Webhook } from 'svix';

jest.mock('svix');
jest.mock('@clerk/backend', () => ({
  createClerkClient: jest
    .fn()
    .mockReturnValue({ users: { getUser: jest.fn() } }),
}));

describe('ClerkWebhookController', () => {
  let controller: ClerkWebhookController;

  const mockUserService = {
    syncUserFromWebhook: jest.fn().mockResolvedValue({ id: 'user-1' }),
    getUserByClerkId: jest
      .fn()
      .mockResolvedValue({ id: 'user-1', clerkId: 'clerk-1' }),
    deleteUser: jest
      .fn()
      .mockResolvedValue({ message: 'User deleted from database' }),
  };

  const mockVerify = jest.fn();

  const SVIX_ID = 'svix-id-1';
  const SVIX_TIMESTAMP = '1234567890';
  const SVIX_SIGNATURE = 'v1,signature';

  beforeEach(async () => {
    process.env.CLERK_WEBHOOK_SECRET = 'test-secret';
    (Webhook as unknown as jest.Mock).mockImplementation(() => ({
      verify: mockVerify,
    }));

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClerkWebhookController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<ClerkWebhookController>(ClerkWebhookController);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.CLERK_WEBHOOK_SECRET;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleClerkWebhook', () => {
    it('should sync user on user.created event', async () => {
      const webhookData = { id: 'clerk-1', first_name: 'Alice' };
      mockVerify.mockReturnValue({ type: 'user.created', data: webhookData });

      const result = await controller.handleClerkWebhook(
        webhookData,
        SVIX_ID,
        SVIX_TIMESTAMP,
        SVIX_SIGNATURE,
      );

      expect(result).toEqual({ received: true });
      expect(mockUserService.syncUserFromWebhook).toHaveBeenCalledWith(
        webhookData,
      );
    });

    it('should sync user on user.updated event', async () => {
      const webhookData = { id: 'clerk-1', first_name: 'Alice Updated' };
      mockVerify.mockReturnValue({ type: 'user.updated', data: webhookData });

      const result = await controller.handleClerkWebhook(
        webhookData,
        SVIX_ID,
        SVIX_TIMESTAMP,
        SVIX_SIGNATURE,
      );

      expect(result).toEqual({ received: true });
      expect(mockUserService.syncUserFromWebhook).toHaveBeenCalledWith(
        webhookData,
      );
    });

    it('should delete user on user.deleted event', async () => {
      mockVerify.mockReturnValue({
        type: 'user.deleted',
        data: { id: 'clerk-1' },
      });

      const result = await controller.handleClerkWebhook(
        {},
        SVIX_ID,
        SVIX_TIMESTAMP,
        SVIX_SIGNATURE,
      );

      expect(result).toEqual({ received: true });
      expect(mockUserService.getUserByClerkId).toHaveBeenCalledWith('clerk-1');
      expect(mockUserService.deleteUser).toHaveBeenCalledWith('user-1');
    });

    it('should return error object when signature verification fails', async () => {
      mockVerify.mockImplementation(() => {
        throw new Error('Bad signature');
      });

      const result = await controller.handleClerkWebhook(
        {},
        SVIX_ID,
        SVIX_TIMESTAMP,
        SVIX_SIGNATURE,
      );

      expect(result).toEqual({ error: 'Invalid signature' });
      expect(mockUserService.syncUserFromWebhook).not.toHaveBeenCalled();
    });

    it('should throw when CLERK_WEBHOOK_SECRET is not set', async () => {
      delete process.env.CLERK_WEBHOOK_SECRET;

      await expect(
        controller.handleClerkWebhook(
          {},
          SVIX_ID,
          SVIX_TIMESTAMP,
          SVIX_SIGNATURE,
        ),
      ).rejects.toThrow('Webhook secret not configured');
    });

    it('should still return {received: true} when user sync throws', async () => {
      const webhookData = { id: 'clerk-1' };
      mockVerify.mockReturnValue({ type: 'user.created', data: webhookData });
      mockUserService.syncUserFromWebhook.mockRejectedValueOnce(
        new Error('DB error'),
      );

      const result = await controller.handleClerkWebhook(
        webhookData,
        SVIX_ID,
        SVIX_TIMESTAMP,
        SVIX_SIGNATURE,
      );

      expect(result).toEqual({ received: true });
    });
  });
});
