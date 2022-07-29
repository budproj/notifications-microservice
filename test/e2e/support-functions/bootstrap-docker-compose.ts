import { join as pathJoin } from 'node:path';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
  Wait,
} from 'testcontainers';

const composeFilePath = pathJoin(process.env.PWD, 'test');
const waitForText = Wait.forLogMessage;

let dockerComposeEnvironment: StartedDockerComposeEnvironment;

export const bootstrapDockerCompose = async () => {
  dockerComposeEnvironment = await new DockerComposeEnvironment(
    composeFilePath,
    'e2e.docker-compose.yml',
  )
    .withWaitStrategy(
      'postgres_1',
      waitForText('database system is ready to accept connections'),
    )
    .withWaitStrategy(
      'nats_1',
      waitForText('Listening for client connections on 0.0.0.0:4222'),
    )
    .withWaitStrategy(
      'postgres_1',
      waitForText('database system is ready to accept connections'),
    )
    .withWaitStrategy(
      'api_1',
      waitForText('Nest application successfully started'),
    )
    .withWaitStrategy('fake-jwt-server_1', waitForText('-----'))
    .up();

  const [jwtProviderContainer, natsContainer, postgresContainer, apiContainer] =
    [
      dockerComposeEnvironment.getContainer('fake-jwt-server'),
      dockerComposeEnvironment.getContainer('nats'),
      dockerComposeEnvironment.getContainer('postgres'),
      dockerComposeEnvironment.getContainer('api'),
    ];

  global.__nats__ = {
    host: natsContainer.getHost(),
    port: natsContainer.getMappedPort(4222),
  };

  global.__postgres__ = {
    host: postgresContainer.getHost(),
    port: postgresContainer.getMappedPort(5432),
  };

  global.__jwt__ = {
    host: jwtProviderContainer.getHost(),
    port: jwtProviderContainer.getMappedPort(8088),
  };

  global.__api__ = {
    host: apiContainer.getHost(),
    port: apiContainer.getMappedPort(3000),
  };
};

export const tearDownDockerCompose = async () => {
  await dockerComposeEnvironment.down();
  await dockerComposeEnvironment.stop();
};
