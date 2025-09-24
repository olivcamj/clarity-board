import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    const prisma: PrismaClient = this as PrismaClient;
    await prisma.$connect();
  }

  async onModuleDestroy(this: PrismaService): Promise<void> {
    await this.$disconnect();
  }
}
