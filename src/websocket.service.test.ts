import * as SocketMock from 'socket.io-mock';
import { Test } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { PrismaService } from './infrastructure/orm/prisma.service';
import { NotificationService } from './notification.service';
import { WebSocketService } from './websocket.service';

const socketMock = new SocketMock();
const emitSpy = jest.spyOn(socketMock, 'emit');

beforeEach(jest.resetAllMocks);

describe('App Gateway', () => {
  const verifyTokenMock = jest.fn();
  const notificationsNoficationsServiceMock = jest.fn();
  const updatenotificationsNoficationsServiceMock = jest.fn();
  const serverToMock = jest.fn();

  const serverSocketsMock = new Map();

  beforeEach(() => serverSocketsMock.clear());

  let eventsGateway;

  beforeEach(async () => {
    const serverMock = {
      sockets: { sockets: serverSocketsMock },
      to: serverToMock,
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

  beforeEach(() => {
    socketMock.data = { userSub: decodedToken.sub };
  });

  afterEach(() => {
    delete socketMock.data;
  });

  const userToken =
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const decodedToken = {
    sub: '1234567890',
    name: 'John Doe',
    iat: 1516239022,
  };

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

  describe('handleConnection', () => {
    const authorizedSocket = {
      ...socketMock,
      handshake: { auth: { token: userToken } },
    };

    beforeEach(() => {
      delete socketMock.data;
      verifyTokenMock.mockImplementation(() => Promise.resolve(decodedToken));
      notificationsNoficationsServiceMock.mockResolvedValue([]);
    });

    it('should verify the token from the Authorization header', async () => {
      // Act
      await eventsGateway.handleConnection(authorizedSocket);

      // Assert
      expect(verifyTokenMock).toBeCalledTimes(1);
      expect(verifyTokenMock).toBeCalledWith(userToken);
    }, 500);

    it('should set the parsed userSub from the token to local state', async () => {
      // Act
      await eventsGateway.handleConnection(authorizedSocket);

      // Assert
      const userSocket = eventsGateway._socketsByUserSub.get(decodedToken.sub);
      expect(userSocket).toBe(authorizedSocket.id);
    }, 500);

    it('should add the user sub to socket data', async () => {
      // Act
      await eventsGateway.handleConnection(authorizedSocket);

      // Assert
      expect(authorizedSocket.data.userSub).toBe(decodedToken.sub);
    }, 500);

    it('should get the user notifications', async () => {
      // Arrange
      const getNotificationSpy = jest.spyOn(eventsGateway, 'getNotifications');

      // Act
      await eventsGateway.handleConnection(authorizedSocket);

      // Assert
      expect(getNotificationSpy).toBeCalledTimes(1);
      expect(getNotificationSpy).toBeCalledWith(authorizedSocket);
    }, 500);
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

  describe('getNotifications', () => {
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

    beforeEach(() => {
      notificationsNoficationsServiceMock.mockResolvedValue(
        mockOfNotifications,
      );
    });

    it("should retrieve the last 50 user's notifications", async () => {
      // Act
      await eventsGateway.getNotifications(socketMock);

      // Assert
      expect(notificationsNoficationsServiceMock).toBeCalledTimes(1);
      expect(notificationsNoficationsServiceMock).toBeCalledWith({
        where: { recipientId: decodedToken.sub },
        take: 50,
      });
    }, 500);

    it('should emit a newNotification event to the each notification', async () => {
      // Act
      await eventsGateway.getNotifications(socketMock);

      // Assert
      expect(emitSpy).toBeCalledTimes(mockOfNotifications.length);
      mockOfNotifications.forEach((notification) => {
        expect(emitSpy).toBeCalledWith('newNotification', notification);
      });
    }, 500);
  });

  describe('readNotifications', () => {
    it('should update the notifications to be marked as seen where the recipiet id is the same as the userid', async () => {
      // Act
      await eventsGateway.readNotifications(socketMock);

      // Assert
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
      // Arrange
      serverToMock.mockReturnValue(socketMock);
      eventsGateway._socketsByUserSub.set(userSub, socketMock.id);

      // Act
      eventsGateway.notifyUser(userSub, notificationData);

      // Assert
      expect(serverToMock).toBeCalledTimes(1);
      expect(serverToMock).toBeCalledWith(socketMock.id);
      expect(emitSpy).toBeCalledTimes(1);
      expect(emitSpy).toBeCalledWith('newNotification', notificationData);
    });
  });
});
