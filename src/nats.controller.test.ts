import { ClientNats, ClientsModule, Transport } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { NatsController } from './nats.controller';
import { WebSocketService } from './websocket.service';

describe('NATS Controller', () => {
  let natsController: NatsController;
  const emitMock = jest.spyOn(ClientNats.prototype, 'emit');

  beforeEach(jest.resetAllMocks);

  // Module Setup
  beforeEach(async () => {
    const WebSocketServiceMock = {};

    const moduleRef = await Test.createTestingModule({
      imports: [
        ClientsModule.register([
          { name: 'NATS_SERVICE', transport: Transport.NATS },
        ]),
      ],
      controllers: [NatsController],
      providers: [WebSocketService],
    })
      .overrideProvider(WebSocketService)
      .useValue(WebSocketServiceMock)
      .compile();

    natsController = moduleRef.get(NatsController);
  });

  describe('health-check messages', () => {
    it('should emit back to the reply queue', () => {
      // Arrange
      const data = { reply: 'testReplyQueue' };

      // Act
      natsController.onHealthCheck(data);

      // Assert
      expect(emitMock).toBeCalledTimes(1);
      expect(emitMock).toBeCalledWith('testReplyQueue', true);
    });
  });
});
