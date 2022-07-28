import { connect, NatsConnection, JSONCodec } from 'nats';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
  Wait,
} from 'testcontainers';
import { randomUUID } from 'node:crypto';
import { join as pathJoin } from 'node:path';
import { bootstrapDockerCompose } from '../support-functions/bootstrap-docker-compose';

describe('NATS Health Check', () => {
  jest.setTimeout(120_000);

  let natsConnection: NatsConnection;
  let dockerComposeEnvironment: StartedDockerComposeEnvironment;
  const jsonCodec = JSONCodec<any>();

  beforeAll(async () => {
    const environment = await bootstrapDockerCompose();
    dockerComposeEnvironment = environment.dockerComposeEnvironment;

    const natsEnv = environment.nats;
    const natsConnectionString = `nats://${natsEnv.host}:${natsEnv.port}`;

    natsConnection = await connect({ servers: natsConnectionString });
  });

  afterAll(async () => {
    await natsConnection.drain();
    await natsConnection.close();

    await dockerComposeEnvironment.down();
    await dockerComposeEnvironment.stop();
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
