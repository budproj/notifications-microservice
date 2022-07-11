import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { connect, NatsConnection, JSONCodec } from 'nats';
import { AppModule } from '../src/app.module';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { Transport } from '@nestjs/microservices';
import { randomUUID } from 'crypto';

describe('NATS Health Check', () => {
  jest.setTimeout(120_000);

  let container: StartedTestContainer;
  let natsConnectionString: string;
  let natsConnection: NatsConnection;
  const jsonCodec = JSONCodec<any>();

  beforeEach(async () => {
    container = await new GenericContainer('nats:alpine')
      .withExposedPorts(4222)
      .start();

    natsConnectionString = `nats://${container.getHost()}:${container.getMappedPort(
      4222,
    )}`;
    // natsConnectionString = 'nats://localhost:4222';

    console.log('AAAAAAAAAAA', natsConnectionString);

    process.env.NATS_CONNECTION_STRING = natsConnectionString;

    natsConnection = await connect({ servers: natsConnectionString });
  });

  let app: INestApplication;

  beforeEach(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await testingModule.createNestApplication();

    await app.connectMicroservice({
      transport: Transport.NATS,
      options: {
        servers: [natsConnectionString],
      },
    });

    await app.startAllMicroservices();
    await app.listen(0);
  });

  afterEach(async () => {
    await app.close();
  });

  afterEach(async () => {
    await natsConnection.drain();
    await natsConnection.close();
    await container.stop();
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
