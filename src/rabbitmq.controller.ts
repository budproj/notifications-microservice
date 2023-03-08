import { Controller, Logger } from '@nestjs/common';
import { notification } from '@prisma/client';

import { Payload } from '@nestjs/microservices';
import { HealthCheckDBService } from './healthcheck.db.service';
import { NotificationService } from './notification.service';
import { WebSocketService } from './websocket.service';
import {
  AmqpConnection,
  defaultNackErrorHandler,
  RabbitRPC,
} from '@golevelup/nestjs-rabbitmq';

@Controller()
export class RabbitmqController {
  constructor(
    private webSocketService: WebSocketService,
    private healthCheckDB: HealthCheckDBService,
    private notification: NotificationService,
    private readonly rabbitmq: AmqpConnection,
  ) {}

  private readonly logger = new Logger(RabbitmqController.name);

  @RabbitRPC({
    exchange: 'bud',
    queue: 'notifications-microservice.notification',
    routingKey: 'notifications-microservice.notification',
    errorHandler: defaultNackErrorHandler,
    queueOptions: {
      deadLetterExchange: 'dead',
      deadLetterRoutingKey: 'dead',
    },
  })
  onNewNotification(@Payload() notificationData: notification) {
    this.logger.log(`New notification: ${JSON.stringify(notificationData)}`);
    this.notification.createnotification(notificationData);
    this.webSocketService.notifyUser(
      notificationData.recipientId,
      notificationData,
    );
  }

  @RabbitRPC({
    exchange: 'bud',
    queue: 'notifications-microservice.health-check',
    routingKey: 'notifications-microservice.health-check',
    errorHandler: defaultNackErrorHandler,
    queueOptions: {
      deadLetterExchange: 'dead',
      deadLetterRoutingKey: 'dead',
    },
  })
  async onHealthCheck(@Payload() data: { id: string; reply: string }) {
    const response = await this.healthCheckDB.patch(data.id);

    await this.rabbitmq.publish('bud', data.reply, true);
  }
}
