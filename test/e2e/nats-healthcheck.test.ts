import { connect, NatsConnection, JSONCodec } from 'nats';
import { randomUUID } from 'node:crypto';
import { getNatsConnectionString } from './support-functions/generate-connection-strings';

describe('NATS Health Check', () => {
  jest.setTimeout(120_000);

  let natsConnection: NatsConnection;
  const jsonCodec = JSONCodec<any>();

  beforeAll(async () => {
    const natsConnectionString = getNatsConnectionString(global.__nats__);
    natsConnection = await connect({ servers: natsConnectionString });
  });

  afterAll(async () => {
    await natsConnection.drain();
    await natsConnection.close();
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
