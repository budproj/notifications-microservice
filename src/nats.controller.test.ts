import { Test } from '@nestjs/testing';
import { ModuleMocker } from 'jest-mock';
import { NatsController } from './nats.controller';
import { WebSocketService } from './websocket.service';

const moduleMocker = new ModuleMocker(global);

describe('NATS Controller', () => {
  let natsController: NatsController;

  beforeEach(async () => {
    const WebSocketServiceMock = {};

    // This mocks related controllers
    const moduleRef = await Test.createTestingModule({
      controllers: [NatsController],
      providers: [WebSocketService],
    })
      .overrideProvider(WebSocketService)
      .useValue(WebSocketServiceMock)
      .compile();

    natsController = moduleRef.get(NatsController);
  });

  describe('health-check messages', () => {
    it('should return true', () => {
      // Arrange

      // Act
      const result = natsController.onHealthCheck();

      // Assert
      expect(result).toBe(true);
    });
  });
});
