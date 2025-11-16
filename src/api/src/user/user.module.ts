import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClerkAuthGuard } from 'src/guards/clerk-auth.guard';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, ClerkAuthGuard],
  exports: [UserService],
})
export class UserModule {}
