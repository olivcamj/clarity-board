import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/client';
import { withAccelerate } from '@prisma/extension-accelerate';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const prismaExtended = new PrismaClient().$extends(withAccelerate());
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    Object.assign(this, prismaExtended);
  }
  async onModuleInit(): Promise<void> {
    const prisma: PrismaClient = this as PrismaClient;
    await prisma.$connect();
  }

  async onModuleDestroy(this: PrismaService): Promise<void> {
    await this.$disconnect();
  }
}
