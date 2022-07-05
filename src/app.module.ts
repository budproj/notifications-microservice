import { Module } from '@nestjs/common';
import { NatsController } from './nats.controller';
import { WebSocketService } from './websocket.service';

@Module({
  imports: [],
  controllers: [NatsController],
  providers: [WebSocketService],
})
export class AppModule {}
