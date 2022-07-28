import { io, Socket } from 'socket.io-client';
import { join as pathJoin } from 'node:path';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
  Wait,
} from 'testcontainers';
import { bootstrapDockerCompose } from '../support-functions/bootstrap-docker-compose';

describe('Healthcheck messages', () => {
  jest.setTimeout(120_000);

  let clientSocket: Socket;
  let dockerComposeEnvironment: StartedDockerComposeEnvironment;
  let fakeValidToken: string;

  beforeAll(async () => {
    const environment = await bootstrapDockerCompose();
    dockerComposeEnvironment = environment.dockerComposeEnvironment;

    const jwtEnv = environment.jwt;

    fakeValidToken = await fetch(`http://${jwtEnv.host}:${jwtEnv.port}/`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ claims: { sub: '12345' } }),
    }).then((res) => res.text());

    const apiEnv = environment.api;
    const wsConnectionString = `ws://${apiEnv.host}:${apiEnv.port}`;
    clientSocket = io(wsConnectionString, { auth: { token: fakeValidToken } });
  });

  afterAll(async () => {
    clientSocket.close();
    await dockerComposeEnvironment.down();
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
