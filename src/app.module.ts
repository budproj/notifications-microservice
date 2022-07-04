import { Module } from '@nestjs/common';
import { WebSocketService } from './websocket.service';

@Module({
  imports: [],
  controllers: [],
  providers: [WebSocketService],
})
export class AppModule {}
