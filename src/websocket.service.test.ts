import * as SocketMock from 'socket.io-mock';
import { WebSocketService } from './websocket.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { PrismaService } from './infrastructure/orm/prisma.service';
import { Test } from '@nestjs/testing';

const socketMock = new SocketMock();
const emitSpy = jest.spyOn(socketMock, 'emit');

beforeEach(jest.resetAllMocks);

describe('App Gateway', () => {
  const authService = new AuthService();
  // const verifyTokenSpy = jest.spyOn(authService, 'verifyToken');
  const verifyTokenMock = jest.fn();
  const notificationsNoficationsServiceMock = jest.fn();
  const updatenotificationsNoficationsServiceMock = jest.fn();
  const serverSocketsMock = new Map();

  beforeEach(() => serverSocketsMock.clear());

  // const prismaService = new PrismaService();
  // const noficationsService = new NotificationService(prismaService);
  // const eventsGateway = new WebSocketService(authService, noficationsService);
  let eventsGateway;
  const get = jest.fn();

  beforeEach(async () => {
    const serverMock = {
      sockets: { sockets: serverSocketsMock },
    };
    const noficationsServiceMock = {
      notifications: notificationsNoficationsServiceMock,
      updatenotifications: updatenotificationsNoficationsServiceMock,
    };

    const authServiceMock = {
      verifyToken: verifyTokenMock,
    };
    const prismaServiceMock = {};

    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [],
      providers: [
        WebSocketService,
        NotificationService,
        PrismaService,
        AuthService,
      ],
    })
      .overrideProvider(NotificationService)
      .useValue(noficationsServiceMock)
      .overrideProvider(AuthService)
      .useValue(authServiceMock)
      .overrideProvider(PrismaService)
      .useValue(prismaServiceMock)
      .compile();

    eventsGateway = moduleRef.get(WebSocketService);
    eventsGateway._server = serverMock;
  });

  describe('health-check', () => {
    it('should emit back the same message', () => {
      // Arrrange (Ajeitar)
      const data = 5;
      // Act (Atuar)
      const response = eventsGateway.onHealthcheck(data, socketMock);

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
    const messageData = { token: userToken };
    // const getNotificationsSpy = jest.spyOn(noficationsService, 'notifications');

    beforeEach(() => {
      verifyTokenMock.mockImplementation(() => Promise.resolve(decodedToken));
      notificationsNoficationsServiceMock.mockResolvedValue([]);
    });

    it('should parse the user token and add the sub property to local state', async () => {
      await eventsGateway.connected(messageData, socketMock);
      expect(eventsGateway._socketsByUserSub.get(decodedToken.sub)).toBe(
        socketMock.id,
      );
    });

    it('should add the user sub to socket data', async () => {
      await eventsGateway.connected(messageData, socketMock);
      expect(socketMock.data.userSub).toBe(decodedToken.sub);
    });

    it("should retrieve the last 50 user's notifications", async () => {
      await eventsGateway.connected(messageData, socketMock);

      expect(notificationsNoficationsServiceMock).toBeCalledTimes(1);
      expect(notificationsNoficationsServiceMock).toBeCalledWith({
        where: { recipientId: decodedToken.sub },
        take: 50,
      });
    });

    it('should emit a newNotification event to the each notification', async () => {
      // arrange
      const mockOfNotifications = [
        {
          id: 'abc123',
          isRead: false,
          type: 'checkin',
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
            previousConfidance: 33,
            newConfidence: -1,
          },
        },
        {
          id: 'abc123',
          isRead: false,
          type: 'taskAssign',
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
        },
      ];
      notificationsNoficationsServiceMock.mockResolvedValue(
        mockOfNotifications,
      );

      // act
      await eventsGateway.connected(messageData, socketMock);

      // assert
      expect(emitSpy).toBeCalledTimes(mockOfNotifications.length);
      mockOfNotifications.forEach((notification) => {
        expect(emitSpy).toBeCalledWith('newNotification', notification);
      });
    });
  });

  describe('readNotifications', () => {
    // const updatenotificationsNoficationsServiceMock = jest.spyOn(
    //   noficationsService,
    //   'updatenotifications',
    // );
    it('should update the notifications to be marked as seen where the recipiet id is the same as the userid', async () => {
      // Arrange

      // Act
      await eventsGateway.readNotifications(socketMock);

      // expect(notifications).to(mockOfNotifications);
      expect(updatenotificationsNoficationsServiceMock).toBeCalledWith({
        where: { recipientId: socketMock.data.userSub, isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('notifyUser', () => {
    const userSub = '123456';
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

    it('should emit a newNotification message containing the notification data if the given user sub is connected', () => {
      const getServerSocketsSpy = jest.spyOn(serverSocketsMock, 'get');
      getServerSocketsSpy.mockReturnValue(socketMock);

      eventsGateway.notifyUser(userSub, notificationData);

      expect(getServerSocketsSpy).toBeCalledTimes(1);
      expect(emitSpy).toBeCalledWith('newNotification', notificationData);
    });

    it('should not emit a newNotification message if the user is not connected', () => {
      const getServerSocketsSpy = jest.spyOn(serverSocketsMock, 'get');
      eventsGateway.notifyUser(userSub, notificationData);
      expect(getServerSocketsSpy).toBeCalledTimes(1);
      expect(emitSpy).toBeCalledTimes(0);
    });
  });
});
