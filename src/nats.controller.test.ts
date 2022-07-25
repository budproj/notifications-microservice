import { ClientNats, ClientsModule, Transport } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { HealthCheckDBService } from './healthcheck.db.service';
import { NatsController } from './nats.controller';
import { NotificationService } from './notification.service';
import { WebSocketService } from './websocket.service';

describe('NATS Controller', () => {
  let natsController: NatsController;
  const emitMock = jest.spyOn(ClientNats.prototype, 'emit');
  const dbHealthCheckPath = jest.fn();
  const notificationCreation = jest.fn();
  const notifyUser = jest.fn();

  beforeEach(jest.resetAllMocks);

  // Module Setup
  beforeEach(async () => {
    const WebSocketServiceMock = { notifyUser: notifyUser };
    const HealthCheckDBServiceMock = { patch: dbHealthCheckPath };
    const NotificationServiceMock = {
      createnotification: notificationCreation,
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        ClientsModule.register([
          { name: 'NATS_SERVICE', transport: Transport.NATS },
        ]),
      ],
      controllers: [NatsController],
      providers: [WebSocketService, HealthCheckDBService, NotificationService],
    })
      .overrideProvider(WebSocketService)
      .useValue(WebSocketServiceMock)
      .overrideProvider(HealthCheckDBService)
      .useValue(HealthCheckDBServiceMock)
      .overrideProvider(NotificationService)
      .useValue(NotificationServiceMock)
      .compile();

    natsController = moduleRef.get(NatsController);
  });

  describe('health-check messages', () => {
    it('should emit back to the reply queue', async () => {
      // Arrange
      const data = { id: 'some id', reply: 'testReplyQueue' };

      // Act
      await natsController.onHealthCheck(data);

      // Assert
      expect(emitMock).toBeCalledTimes(1);
      expect(emitMock).toBeCalledWith('testReplyQueue', true);
    });

    it('should patch the database with an id', async () => {
      // Arrange
      const data = { id: 'some id', reply: 'testReplyQueue' };

      // Act
      await natsController.onHealthCheck(data);

      // Assert
      expect(dbHealthCheckPath).toBeCalledTimes(1);
      expect(dbHealthCheckPath).toBeCalledWith('some id');
    });
  });

  describe('notifications', () => {
    const notificationData = {
      id: 'abc123',
      isRead: false,
      type: 'supportTeam',
      timestamp: new Date(),
      messageId: '12312',
      recipientId: '12312',
      properties: {
        sender: {
          id: '1232',
          name: 'Ricardo',
          picture: 'https://www.gravatar.com/avatar/0?d=mp&f=y',
        },
        keyResult: {
          id: '12331',
          name: 'Teste',
        },
      },
    };
    it('should save the notification on the database', async () => {
      natsController.onNewNotification(notificationData);
      expect(notificationCreation).toBeCalledWith(notificationData);
    });
    it('should notify the user via websocket', () => {
      natsController.onNewNotification(notificationData);
      expect(notifyUser).toBeCalledWith(
        notificationData.recipientId,
        notificationData,
      );
    });
  });
});
