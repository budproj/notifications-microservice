import { io, Socket } from 'socket.io-client';
import {
  generateInvalidJwt,
  generateValidJwt,
} from './support-functions/generateJwt';
import {
  getNatsConnectionString,
  getPostgresConnectionString,
  getWsConnectionString,
} from './support-functions/generate-connection-strings';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { connect, JSONCodec, NatsConnection } from 'nats';
import waitForExpect from 'wait-for-expect'

describe('Healthcheck messages', () => {
  jest.setTimeout(120_000);

  let fakeValidToken: string;
  let tokenForAnotherUser: string;
  let fakeInvalidToken: string;
  let dbConnection: PrismaClient;
  let wsConnectionString: string;

  beforeAll(async () => {
    fakeValidToken = await generateValidJwt({ sub: '12345' });
    tokenForAnotherUser = await generateValidJwt({ sub: 'other-user' });
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
    let clientSocket: Socket;
    let natsConnection: NatsConnection;
    const newNotificationMock = jest.fn();
    const jsonCodec = JSONCodec<any>();

    beforeEach(jest.resetAllMocks);
    beforeEach(() => {
      clientSocket = io(wsConnectionString, {
        auth: { token: fakeValidToken },
      });
      clientSocket.on('newNotification', newNotificationMock);
    });
    afterEach(() => clientSocket.disconnect());

    beforeAll(async () => {
      const natsConnectionString = getNatsConnectionString(global.__nats__);
      natsConnection = await connect({ servers: natsConnectionString });
    });

    afterAll(async () => {
      await natsConnection.drain();
      await natsConnection.close();
    });

    it('should receive notification when online', async () => {
      // Arrange
      const notificationData = {
        messageId: randomUUID(),
        isRead: false,
        type: 'a type',
        timestamp: new Date().toISOString(),
        recipientId: '12345',
        properties: { notifiaction: 'data' },
      };

      // Act
      natsConnection.publish(
        'notification',
        jsonCodec.encode(notificationData),
      );

      // Assert
      await waitForExpect(() => {
        expect(newNotificationMock).toBeCalledTimes(1);
        expect(newNotificationMock).toBeCalledWith(
          expect.objectContaining(notificationData),
        );
      });
    });

    it('should notify multiple connections to same user', async () => {
      // Arrange
      const notificationData = {
        messageId: randomUUID(),
        isRead: false,
        type: 'a type',
        timestamp: new Date().toISOString(),
        recipientId: '12345',
        properties: { notifiaction: 'data' },
      };
      const secondclientSocket = io(wsConnectionString, {
        auth: { token: fakeValidToken },
      });
      secondclientSocket.on('newNotification', newNotificationMock);

      // Act
      natsConnection.publish(
        'notification',
        jsonCodec.encode(notificationData),
      );

      // Assert
      await waitForExpect(() => {
        expect(newNotificationMock).toBeCalledTimes(2);
        expect(newNotificationMock).toBeCalledWith(
          expect.objectContaining(notificationData),
        );
        secondclientSocket.disconnect();
      });
    });

    it('should not notify other user', async () => {
      // Arrange
      const notificationData = {
        messageId: randomUUID(),
        isRead: false,
        type: 'a type',
        timestamp: new Date().toISOString(),
        recipientId: '12345',
        properties: { notifiaction: 'data' },
      };
      const secondclientSocket = io(wsConnectionString, {
        auth: { token: tokenForAnotherUser },
      });
      const anotherUserNewNotification = jest.fn()
      secondclientSocket.on('newNotification', anotherUserNewNotification);

      // Act
      natsConnection.publish(
        'notification',
        jsonCodec.encode(notificationData),
      );

      // Assert
      await waitForExpect(() => {
        expect(anotherUserNewNotification).toBeCalledTimes(0);
        expect(newNotificationMock).toBeCalledTimes(1);
        expect(newNotificationMock).toBeCalledWith(
          expect.objectContaining(notificationData),
        );
        secondclientSocket.disconnect();
      });
    });
  });

  describe('user read notifications', () => {
    it.todo('should read all notifications');
    it.todo('should not read notifications from other users');
  });
});
