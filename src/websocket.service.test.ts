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
      '{"https://api.develop.getbud.co/roles":["Leader"],"iss":"https://getbud-develop.us.auth0.com/","sub":"auth0|5fd773cfd16a7c00694ae5ff","aud":["https://api.develop.getbud.co/business","https://getbud-develop.us.auth0.com/userinfo"],"iat":1657643222,"exp":1657729622,"azp":"R1dkkCw8rdSt5CX1PmrUS7PutKufN5jd","scope":"openid profile email","permissions":["cycle:create:team","cycle:delete:team","cycle:read:company","cycle:read:team","cycle:update:team","key-result-check-in:create:owns","key-result-check-in:delete:owns","key-result-check-in:read:company","key-result-check-in:read:owns","key-result-check-in:read:team","key-result-check-in:update:owns","key-result-check-mark:create:owns","key-result-check-mark:create:team","key-result-check-mark:delete:owns","key-result-check-mark:delete:team","key-result-check-mark:read:company","key-result-check-mark:read:owns","key-result-check-mark:read:team","key-result-check-mark:update:owns","key-result-check-mark:update:team","key-result-comment:create:company","key-result-comment:create:owns","key-result-comment:create:team","key-result-comment:delete:owns","key-result-comment:read:company","key-result-comment:read:owns","key-result-comment:read:team","key-result-comment:update:owns","key-result:create:owns","key-result:create:team","key-result-custom-list:create:owns","key-result-custom-list:delete:owns","key-result-custom-list:read:owns","key-result-custom-list:update:owns","key-result:delete:owns","key-result:delete:team","key-result:read:company","key-result:read:owns","key-result:read:team","key-result:update:owns","objective:create:owns","objective:create:team","objective:delete:owns","objective:delete:team","objective:read:company","objective:read:owns","objective:read:team","objective:update:owns","objective:update:team","permission:read:owns","team:create:owns","team:delete:owns","team:read:company","team:read:owns","team:update:owns","user:create:team","user:delete:owns","user:delete:team","user:read:company","user:read:owns","user:read:team","user:update:owns","user:update:team"]}';
    const user = JSON.parse(userToken);
    const userSub = user.sub;

    it('should parse the user token and add the sub property to local state', () => {
      eventsGateway.connected(userToken, socketMock);
      expect(eventsGateway._socketsByUserSub.get(userSub)).toBe(socketMock.id);
    });

    it('should add the user sub to socket data', () => {
      eventsGateway.connected(userToken, socketMock);
      expect(socketMock.data.userSub).toBe(userSub);
    });

    it.todo("should retrieve the last 50 user's notifications");

    it('should emit a newNotification event to the each of the 50 notifications', () => {
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
      eventsGateway.connected(userToken, socketMock);

      // assert
      expect(emitSpy).toBeCalledTimes(3);
      mockOfNotifications.forEach((notification) => {
        expect(emitSpy).toBeCalledWith('newNotification', notification);
      });
    });
  });
});
