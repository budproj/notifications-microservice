import { io } from 'socket.io-client';
import {
  generateInvalidJwt,
  generateValidJwt,
} from './support-functions/generateJwt';
import {
  getPostgresConnectionString,
  getWsConnectionString,
} from './support-functions/generate-connection-strings';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

describe('Healthcheck messages', () => {
  jest.setTimeout(120_000);

  let fakeValidToken: string;
  let fakeInvalidToken: string;
  let dbConnection: PrismaClient;
  let wsConnectionString: string;

  beforeAll(async () => {
    fakeValidToken = await generateValidJwt({ sub: '12345' });
    fakeInvalidToken = await generateInvalidJwt({ sub: '12345' });
    wsConnectionString = getWsConnectionString(global.__api__);

    const postgresConStr = getPostgresConnectionString(global.__postgres__);
    dbConnection = new PrismaClient({
      datasources: { db: { url: postgresConStr } },
    });

    await dbConnection.$connect();
  });

  beforeEach(async () => {
    await dbConnection.notification.deleteMany();
  });

  afterAll(async () => {
    await dbConnection.$disconnect();
  });

  describe('at connection', () => {
    it('should connect with valid token and receive notifications', () =>
      new Promise(async (resolve) => {
        // Arrange
        const notificationData = {
          messageId: randomUUID(),
          isRead: false,
          type: 'a type',
          timestamp: new Date().toISOString(),
          recipientId: '12345',
          properties: { notifiaction: 'data' },
        };
        await dbConnection.notification.create({ data: notificationData });

        // Act
        const clientSocket = io(wsConnectionString, {
          auth: { token: fakeValidToken },
        });
        clientSocket.on('newNotification', assertionCallback);

        // Assert
        function assertionCallback(data) {
          expect(data).toEqual(expect.objectContaining(notificationData));
          clientSocket.close();
          resolve('');
        }
      }));

    it('should disconnect with an invalid token', () =>
      new Promise(async (resolve) => {
        // Arrange
        const newNotificationAckMock = jest.fn();
        const notificationData = {
          messageId: randomUUID(),
          isRead: false,
          type: 'a type',
          timestamp: new Date().toISOString(),
          recipientId: '12345',
          properties: { notifiaction: 'data' },
        };
        await dbConnection.notification.create({ data: notificationData });

        // Act
        const clientSocket = io(wsConnectionString, {
          auth: { token: fakeInvalidToken },
        });
        clientSocket.on('newNotification', newNotificationAckMock);
        clientSocket.on('disconnect', assertionCallback);

        // Assert
        function assertionCallback() {
          expect(newNotificationAckMock).toBeCalledTimes(0);
          clientSocket.disconnect();
          resolve('');
        }
      }));
  });

  describe('when online', () => {
    it.todo('should receive notification when online');
    it.todo('should notify multiple connections to same user');
    it.todo('should not notify other user');
  });

  describe('user read notifications', () => {
    it.todo('should read all notifications');
    it.todo('should not read notifications from other users');
  });
});
