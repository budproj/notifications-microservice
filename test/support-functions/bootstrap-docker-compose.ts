import { join as pathJoin } from 'node:path';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
  Wait,
} from 'testcontainers';

const composeFilePath = pathJoin(process.env.PWD, 'test');

export const bootstrapDockerCompose = async () => {
  const dockerComposeEnvironment = await new DockerComposeEnvironment(
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
    .withWaitStrategy(
      'postgres_1',
      Wait.forLogMessage('database system is ready to accept connections'),
    )
    .withWaitStrategy(
      'api_1',
      Wait.forLogMessage('Nest application successfully started'),
    )
    .withWaitStrategy('fake-jwt-server_1', Wait.forLogMessage('-----'))
    .up();

  const [jwtProviderContainer, natsContainer, postgresContainer, apiContainer] =
    [
      dockerComposeEnvironment.getContainer('fake-jwt-server'),
      dockerComposeEnvironment.getContainer('nats'),
      dockerComposeEnvironment.getContainer('postgres'),
      dockerComposeEnvironment.getContainer('api'),
    ];

  const nats = {
    host: natsContainer.getHost(),
    port: natsContainer.getMappedPort(4222),
  };

  const postgres = {
    host: postgresContainer.getHost(),
    port: postgresContainer.getMappedPort(5432),
  };

  const jwt = {
    host: jwtProviderContainer.getHost(),
    port: jwtProviderContainer.getMappedPort(8088),
  };

  const api = {
    host: apiContainer.getHost(),
    port: apiContainer.getMappedPort(3000),
  };

  return { nats, postgres, jwt, api, dockerComposeEnvironment };
};
