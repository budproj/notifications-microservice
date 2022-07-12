import { connect, NatsConnection, JSONCodec } from 'nats';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
} from 'testcontainers';
import { randomUUID } from 'node:crypto';
import { join as joinPath } from 'node:path';

describe('NATS Health Check', () => {
  jest.setTimeout(120_000);

  let natsConnection: NatsConnection;
  let dockerComposeEnvironment: StartedDockerComposeEnvironment;
  const jsonCodec = JSONCodec<any>();

  beforeAll(async () => {
    const composeFilePath = joinPath(process.env.PWD, 'test');

    dockerComposeEnvironment = await new DockerComposeEnvironment(
      composeFilePath,
      'microservice.docker-compose.yml',
    ).up();

    const natsContainer = dockerComposeEnvironment.getContainer('nats-1');

    const natsConnectionString = `nats://${natsContainer.getHost()}:${natsContainer.getMappedPort(
      4222,
    )}`;

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
      jsonCodec.encode({ id: 'myid', biru: 'leibe', reply: replyQueue }),
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
