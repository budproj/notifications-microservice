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

  describe('handleDisconnect', () => {
    const userSub = '123456';
    beforeEach(() => {
      eventsGateway.setSocketsByUserSub(userSub, socketMock.id);
      Object.assign(socketMock, { data: { userSub: userSub } });
    });

    it('should remove userSub from socket', () => {
      // Arrange
      expect(eventsGateway.getSocketsByUserSub(userSub)).toBe(socketMock.id);

      // Act
      eventsGateway.handleDisconnect(socketMock);

      // Assert (Afirmar)
      expect(eventsGateway.getSocketsByUserSub(userSub)).toBeFalsy();
    });
  });
});
