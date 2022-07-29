import { io, Socket } from 'socket.io-client';
import { generateValidJwt } from './support-functions/generateJwt';
import { getWsConnectionString } from './support-functions/generate-connection-strings';

describe('Healthcheck messages', () => {
  jest.setTimeout(120_000);

  let clientSocket: Socket;
  let fakeValidToken: string;

  beforeAll(async () => {
    fakeValidToken = await generateValidJwt({ sub: '12345' });

    const wsConnectionString = getWsConnectionString(global.__api__);
    clientSocket = io(wsConnectionString, { auth: { token: fakeValidToken } });
  });

  afterAll(() => {
    clientSocket.close();
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
