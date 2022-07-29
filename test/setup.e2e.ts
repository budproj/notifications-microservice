import {
  bootstrapDockerCompose,
  tearDownDockerCompose,
} from './e2e/support-functions/bootstrap-docker-compose';

beforeAll(bootstrapDockerCompose);
afterAll(tearDownDockerCompose);
