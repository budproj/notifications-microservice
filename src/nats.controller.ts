import { Controller, Logger } from '@nestjs/common';
import { notification } from '@prisma/client';

import {
  EventPattern,
  MessagePattern,
  Payload,
  Transport,
} from '@nestjs/microservices';
import { HealthCheckDBService } from './healthcheck.db.service';
import { NotificationService } from './notification.service';
import { WebSocketService } from './websocket.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Controller()
export class NatsController {
  constructor(
    private webSocketService: WebSocketService,
    private healthCheckDB: HealthCheckDBService,
    private notification: NotificationService,
    private readonly rabbitmq: AmqpConnection,
  ) {}

  private readonly logger = new Logger(NatsController.name);

  @EventPattern('notification')
  onNewNotification(@Payload() notificationData: notification) {
    this.logger.log(`New notification: ${JSON.stringify(notificationData)}`);
    this.notification.createnotification(notificationData);
    this.webSocketService.notifyUser(
      notificationData.recipientId,
      notificationData,
    );
  }

  @MessagePattern('health-check', Transport.NATS)
  async onHealthCheck(@Payload() data: { id: string; reply: string }) {
    const response = await this.healthCheckDB.patch(data.id);

    await this.rabbitmq.publish('bud', data.reply, true);
  }
}
