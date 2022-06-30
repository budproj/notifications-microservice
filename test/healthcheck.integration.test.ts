import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io as client, Socket as ClientSocket } from 'socket.io-client';

import { AppModule } from '../src/app.module';

describe('Healthcheck messages', () => {
  let app: INestApplication;
  let clientSocket: ClientSocket;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0);
    const server = app.getHttpServer();
    const { port } = server.address();

    clientSocket = client(`ws://localhost:${port}`);
  });

  afterEach(() => {
    app.getHttpServer().close();
    clientSocket.close();
  });

  it('should emit and receive the same response in healthcheck topic', (done) => {
    // Arrange
    expect.assertions(1);

    // Act
    clientSocket.on('healthckeck', assertionCallback);
    clientSocket.emit('healthckeck', 'mensagem');

    //Assert
    function assertionCallback(data) {
      expect(data).toBe('mensagem');
      done();
    }
  });
});
