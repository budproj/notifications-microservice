import { Controller, Logger, NotImplementedException } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  NatsContext,
  Payload,
} from '@nestjs/microservices';
import { WebSocketService } from './websocket.service';

@Controller()
export class NatsController {
  constructor(private webSocketService: WebSocketService) {}

  private readonly logger = new Logger(NatsController.name);

  @EventPattern('notification')
  onNewNotification(
    @Payload() notificationData: unknown,
    @Ctx() context: NatsContext,
  ) {
    throw new NotImplementedException();
    // this.webSocketService.notifyUser(notificationData.userSub, {});
  }

  @MessagePattern('health-check')
  onHealthCheck() {
    return true;
  }
}
