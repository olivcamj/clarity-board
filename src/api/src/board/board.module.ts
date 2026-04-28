import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [BoardService],
  controllers: [BoardController],
})
export class BoardModule {}
