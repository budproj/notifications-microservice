import * as SocketMock from 'socket.io-mock';
import { WebSocketService } from './websocket.service';
import { AuthService } from './auth.service';

const socketMock = new SocketMock();
const emitSpy = jest.spyOn(socketMock, 'emit');

beforeEach(jest.resetAllMocks);

describe('App Gateway', () => {
  const authService = new AuthService();
  const eventsGateway = new WebSocketService(authService);

  const verifyTokenSpy = jest.spyOn(authService, 'verifyToken');

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
      eventsGateway._socketsByUserSub.set(userSub, socketMock.id);
      Object.assign(socketMock, { data: { userSub: userSub } });
    });

    afterEach(() => {
      delete socketMock.data;
    });

    it('should remove userSub from local state', () => {
      // Arrange
      const before = eventsGateway._socketsByUserSub.get(userSub);

      // Act
      eventsGateway.handleDisconnect(socketMock);
      const after = eventsGateway._socketsByUserSub.get(userSub);

      // Assert (Afirmar)
      expect(before).toBe(socketMock.id);
      expect(after).toBeFalsy();
    });
  });

  describe('connected', () => {
    const userToken =
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const decodedToken = {
      sub: '1234567890',
      name: 'John Doe',
      iat: 1516239022,
    };

    beforeEach(() => {
      verifyTokenSpy.mockImplementation(() => Promise.resolve(decodedToken));
    });

    it('should parse the user token and add the sub property to local state', async () => {
      await eventsGateway.connected(userToken, socketMock);
      expect(eventsGateway._socketsByUserSub.get(decodedToken.sub)).toBe(
        socketMock.id,
      );
    });

    it('should add the user sub to socket data', async () => {
      await eventsGateway.connected(userToken, socketMock);
      expect(socketMock.data.userSub).toBe(decodedToken.sub);
    });

    it.todo("should retrieve the last 50 user's notifications");

    it('should emit a newNotification event to the each of the 50 notifications', async () => {
      // arrange
      const mockOfNotifications = [
        {
          id: 'abc123',
          isRead: false,
          type: 'checkin',
          timestamp: '2022-01-01T00:00:00.000Z',
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
            previousConfidance: 33,
            newConfidence: -1,
          },
        },
        {
          id: 'abc123',
          isRead: false,
          type: 'taskAssign',
          timestamp: '2022-01-01T00:00:00.000Z',
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
            task: {
              id: '12331',
              name: 'Teste',
            },
          },
        },
        {
          id: 'abc123',
          isRead: false,
          type: 'supportTeam',
          timestamp: '2022-01-01T00:00:00.000Z',
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
        },
      ];

      // act
      await eventsGateway.connected(userToken, socketMock);

      // assert
      expect(emitSpy).toBeCalledTimes(3);
      mockOfNotifications.forEach((notification) => {
        expect(emitSpy).toBeCalledWith('newNotification', notification);
      });
    });
  });
});
