import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { PrismaClient } from '../../generated/client';

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
      .spyOn(PrismaClient.prototype, '$connect')
      .mockResolvedValue();

    await service.onModuleInit();
    expect(connectSpy).toHaveBeenCalled();
  });

  it('should call $disconnect on destroy', async () => {
    const disconnectSpy = jest
      .spyOn(PrismaClient.prototype, '$disconnect')
      .mockResolvedValue();

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalled();
  });
});
