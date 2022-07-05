import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { WebSocketService } from './websocket.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [WebSocketService],
})
export class AppModule {}
