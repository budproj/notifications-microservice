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
import { HealthCheckDBService } from './healthcheck.db.service';
import { WebSocketService } from './websocket.service';

@Controller()
export class NatsController {
  constructor(
    private webSocketService: WebSocketService,
    private healthCheckDB: HealthCheckDBService,
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
  async onHealthCheck(@Payload() data: { id: string; reply: string }) {
    const response = await this.healthCheckDB.patch(data.id);

    this.client.emit(data.reply, true);
  }
}
