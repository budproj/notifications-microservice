import { connect, NatsConnection, JSONCodec } from 'nats';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
  Wait,
} from 'testcontainers';
import { randomUUID } from 'node:crypto';
import { join as pathJoin } from 'node:path';

describe('NATS Health Check', () => {
  jest.setTimeout(240_000);

  let natsConnection: NatsConnection;
  let dockerComposeEnvironment: StartedDockerComposeEnvironment;
  const jsonCodec = JSONCodec<any>();

  beforeAll(async () => {
    const composeFilePath = pathJoin(process.env.PWD, 'test');

    dockerComposeEnvironment = await new DockerComposeEnvironment(
      composeFilePath,
      'e2e.docker-compose.yml',
    )
      .withWaitStrategy(
        'postgres_1',
        Wait.forLogMessage('database system is ready to accept connections'),
      )
      .withWaitStrategy(
        'nats_1',
        Wait.forLogMessage('Listening for client connections on 0.0.0.0:4222'),
      )
      .up();

    const natsContainer = dockerComposeEnvironment.getContainer('nats-1');

    const [host, port] = [
      natsContainer.getHost(),
      natsContainer.getMappedPort(4222),
    ];
    const natsConnectionString = `nats://${host}:${port}`;

    natsConnection = await connect({ servers: natsConnectionString });
  });

  afterAll(async () => {
    await natsConnection.drain();
    await natsConnection.close();

    await dockerComposeEnvironment.down();
  });

  it('should receive true as response on health check queue', async () => {
    // Arrange
    const uuid = randomUUID();
    const replyQueue = `reply-${uuid}`;

    //Act
    const result = await natsConnection.request(
      'health-check',
      jsonCodec.encode({ id: uuid, reply: replyQueue }),
      {
        timeout: 10_000,
        noMux: true,
        reply: replyQueue,
      },
    );

    //Assert
    const { data: response } = jsonCodec.decode(result.data);
    expect(response).toBe(true);
  });
});
