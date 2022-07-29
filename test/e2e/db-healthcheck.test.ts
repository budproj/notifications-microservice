import { connect, NatsConnection, JSONCodec } from 'nats';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import {
  getNatsConnectionString,
  getPostgresConnectionString,
} from './support-functions/generate-connection-strings';

describe('NATS Health Check', () => {
  jest.setTimeout(120_000);

  let natsConnection: NatsConnection;
  let dbConnection: PrismaClient;
  const jsonCodec = JSONCodec<any>();

  beforeAll(async () => {
    const natsConStr = getNatsConnectionString(global.__nats__);
    const postgresConStr = getPostgresConnectionString(global.__postgres__);

    natsConnection = await connect({ servers: natsConStr });
    dbConnection = new PrismaClient({
      datasources: { db: { url: postgresConStr } },
    });

    await dbConnection.$connect();
  });

  afterAll(async () => {
    await natsConnection.drain();
    await natsConnection.close();
    await dbConnection.$disconnect();
  });

  it('should receive true as response on health check queue', async () => {
    // Arrange
    const uuid = randomUUID();
    const replyQueue = `reply-${uuid}`;

    //Act
    await natsConnection.request(
      'health-check',
      jsonCodec.encode({ id: uuid, reply: replyQueue }),
      {
        timeout: 10_000,
        noMux: true,
        reply: replyQueue,
      },
    );
    const result = await dbConnection.healthCheck.findMany();

    //Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(uuid);
  });
});
