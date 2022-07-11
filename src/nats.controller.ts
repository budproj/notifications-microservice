import {
  Controller,
  Inject,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import {
  ClientProxy,
  Ctx,
  EventPattern,
  MessagePattern,
  NatsContext,
  Payload,
  Transport,
} from '@nestjs/microservices';
import { WebSocketService } from './websocket.service';

@Controller()
export class NatsController {
  constructor(
    private webSocketService: WebSocketService,
    @Inject('NATS_SERVICE') private client: ClientProxy,
  ) {}

  private readonly logger = new Logger(NatsController.name);

  @EventPattern('notification')
  onNewNotification(
    @Payload() notificationData: unknown,
    @Ctx() context: NatsContext,
  ) {
    throw new NotImplementedException();
    // this.webSocketService.notifyUser(notificationData.userSub, {});
  }

  @MessagePattern('health-check', Transport.NATS)
  onHealthCheck(@Payload() data: { reply: string }) {
    console.log('biruleibe', data);
    this.client.emit(data.reply, true);
  }
}
