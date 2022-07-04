import * as SocketMock from 'socket.io-mock';
import { WebSocketService } from './websocket.service';

const socketMock = new SocketMock();
const emitSpy = jest.spyOn(socketMock, 'emit');

beforeEach(jest.resetAllMocks);

describe('App Gateway', () => {
  const eventsGateway = new WebSocketService();

  describe('health-check', () => {
    const onHealthcheck = eventsGateway.onHealthcheck;

    it('should emit back the same message', () => {
      // Arrrange (Ajeitar)
      const data = 5;

      // Act (Atuar)
      const response = onHealthcheck(data, socketMock);

      // Assert (Afirmar)
      expect(emitSpy).toBeCalledTimes(1);
      expect(emitSpy).toBeCalledWith('health-checked', true);
      expect(response).toBe(data);
    });
  });
});
