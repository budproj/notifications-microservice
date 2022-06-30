import * as SocketMock from 'socket.io-mock';

import { EventsGateway } from './app.gateway';

const socketMock = new SocketMock();
const emitSpy = jest.spyOn(socketMock, 'emit');

beforeEach(jest.resetAllMocks);

describe('App Gateway', () => {
  const eventsGateway = new EventsGateway();

  describe('health-check', () => {
    const healthcheck = eventsGateway.healthcheck;

    it('should emit back the same message', () => {
      // Arrrange (Ajeitar)
      const data = 5;

      // Act (Atuar)
      const response = healthcheck(data, socketMock);

      // Assert (Afirmar)
      expect(emitSpy).toBeCalledTimes(1);
      expect(emitSpy).toBeCalledWith('health-checked', true);
      expect(response).toBe(data);
    });
  });
});
