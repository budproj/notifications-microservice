import { Controller, Logger, NotImplementedException } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  NatsContext,
  Payload,
  Transport,
} from '@nestjs/microservices';
import { WebSocketService } from './websocket.service';

@Controller()
export class AppController {
  constructor(private webSocketService: WebSocketService) {}

  private readonly logger = new Logger(AppController.name);

  @EventPattern('notification', Transport.NATS)
  onNewNotification(
    @Payload() notificationData: unknown,
    @Ctx() context: NatsContext,
  ) {
    throw new NotImplementedException();
    // this.webSocketService.notifyUser(notificationData.userSub, {});
  }
}
