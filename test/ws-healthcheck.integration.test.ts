import { io, Socket } from 'socket.io-client';
import { join as pathJoin } from 'node:path';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
} from 'testcontainers';

describe('Healthcheck messages', () => {
  jest.setTimeout(120_000);

  let clientSocket: Socket;
  let dockerComposeEnvironment: StartedDockerComposeEnvironment;

  beforeAll(async () => {
    const composeFilePath = pathJoin(process.env.PWD, 'test');
    dockerComposeEnvironment = await new DockerComposeEnvironment(
      composeFilePath,
      'microservice.docker-compose.yml',
    ).up();
    const natsContainer = dockerComposeEnvironment.getContainer('api-1');

    const [host, port] = [
      natsContainer.getHost(),
      natsContainer.getMappedPort(3000),
    ];
    const wsConnectionString = `ws://${host}:${port}`;
    clientSocket = io(wsConnectionString);
  });

  afterAll(async () => {
    clientSocket.close();
    await dockerComposeEnvironment.stop();
  });

  it('should emit and receive the same response in health-check topic', (done) => {
    // Arrange
    expect.assertions(1);

    // Act
    clientSocket.emit('health-check', 'mensagem', assertionCallback);

    //Assert
    function assertionCallback(data) {
      expect(data).toBe('mensagem');
      done();
    }
  });

  it('should receive message on health-checked', (done) => {
    // Arrange
    expect.assertions(1);

    // Act
    clientSocket.on('health-checked', assertionCallback);
    clientSocket.emit('health-check', 'mensagem');

    //Assert
    function assertionCallback(data) {
      expect(data).toBe(true);
      done();
    }
  });
});
