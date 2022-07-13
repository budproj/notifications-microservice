import { connect, NatsConnection, JSONCodec } from 'nats';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
  Wait,
} from 'testcontainers';
import { randomUUID } from 'node:crypto';
import { join as pathJoin } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { setTimeout } from 'node:timers/promises';

describe('NATS Health Check', () => {
  jest.setTimeout(120_000);

  let natsConnection: NatsConnection;
  let dbConnection: PrismaClient;
  let dockerComposeEnvironment: StartedDockerComposeEnvironment;
  const jsonCodec = JSONCodec<any>();

  beforeAll(async () => {
    const composeFilePath = pathJoin(process.env.PWD, 'test');
    const postgresWaitMessage = Wait.forLogMessage(
      /database system is ready to accept connections/,
    );

    dockerComposeEnvironment = await new DockerComposeEnvironment(
      composeFilePath,
      'e2e.docker-compose.yml',
    )
      .withWaitStrategy('postgres_1', postgresWaitMessage)
      .withWaitStrategy('postgres_1', Wait.forHealthCheck())
      .withWaitStrategy('api_1', Wait.forHealthCheck())
      .up();

    // Connect to Nats Container
    const natsContainer = dockerComposeEnvironment.getContainer('nats-1');

    const [host, port] = [
      natsContainer.getHost(),
      natsContainer.getMappedPort(4222),
    ];
    const natsConnectionString = `nats://${host}:${port}`;

    natsConnection = await connect({ servers: natsConnectionString });

    // Connect to PostgresContainer
    const postgresContainer =
      dockerComposeEnvironment.getContainer('postgres-1');

    const [postgresHost, postgresPort] = [
      postgresContainer.getHost(),
      postgresContainer.getMappedPort(5432),
    ];
    const postgresConnectionString = `postgresql://notifications:changeme@${postgresHost}:${postgresPort}/notifications?schema=public`;

    dbConnection = new PrismaClient({
      datasources: {
        db: { url: postgresConnectionString },
      },
    });

    await dbConnection.$connect();
  });

  afterAll(async () => {
    await natsConnection.drain();
    await natsConnection.close();
    await dbConnection.$disconnect();

    await dockerComposeEnvironment.down();
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
