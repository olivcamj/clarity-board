import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [UserModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
