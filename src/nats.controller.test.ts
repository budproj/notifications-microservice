import { ClientNats, ClientsModule, Transport } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { HealthCheckDBService } from './healthcheck.db.service';
import { NatsController } from './nats.controller';
import { WebSocketService } from './websocket.service';

describe('NATS Controller', () => {
  let natsController: NatsController;
  const emitMock = jest.spyOn(ClientNats.prototype, 'emit');
  const dbHealthCheckPath = jest.fn();

  beforeEach(jest.resetAllMocks);

  // Module Setup
  beforeEach(async () => {
    const WebSocketServiceMock = {};
    const HealthCheckDBServiceMock = { patch: dbHealthCheckPath };

    const moduleRef = await Test.createTestingModule({
      imports: [
        ClientsModule.register([
          { name: 'NATS_SERVICE', transport: Transport.NATS },
        ]),
      ],
      controllers: [NatsController],
      providers: [WebSocketService, HealthCheckDBService],
    })
      .overrideProvider(WebSocketService)
      .useValue(WebSocketServiceMock)
      .overrideProvider(HealthCheckDBService)
      .useValue(HealthCheckDBServiceMock)
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
    })
  });
});
