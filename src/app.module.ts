import { Module } from '@nestjs/common';
import { EventsGateway } from './app.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [EventsGateway],
})
export class AppModule {}
