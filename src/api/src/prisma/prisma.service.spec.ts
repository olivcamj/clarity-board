import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

// Stub the pg Pool so the constructor doesn't need a real DATABASE_URL.
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({})),
}));

// Stub the adapter so PrismaService can be instantiated without a live DB.
jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

// Replace the generated PrismaClient base class with a lightweight stub.
// This prevents Prisma 7's adapter-validation logic from running in tests.
jest.mock('../../generated/client', () => ({
  PrismaClient: class MockPrismaClient {
    $connect    = jest.fn().mockResolvedValue(undefined);
    $disconnect = jest.fn().mockResolvedValue(undefined);
    constructor(_options?: unknown) {}
  },
}));

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call $connect on init', async () => {
    const connectSpy = jest
      .spyOn(service as any, '$connect')
      .mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalled();
  });

  it('should call $disconnect on destroy', async () => {
    const disconnectSpy = jest
      .spyOn(service as any, '$disconnect')
      .mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalled();
  });
});
