export interface Env {
  host: string;
  port: number;
}

export const getPostgresConnectionString = (postgresEnv: Env) =>
  `postgresql://notifications:changeme@${postgresEnv.host}:${postgresEnv.port}/notifications?schema=public`;

export const getNatsConnectionString = (postgresEnv: Env) =>
  `nats://${postgresEnv.host}:${postgresEnv.port}`;

export const getWsConnectionString = (apiEnv: Env) =>
  `ws://${apiEnv.host}:${apiEnv.port}`;

export const getJwtConnectionString = (jwtEnv: Env) =>
  `http://${jwtEnv.host}:${jwtEnv.port}/`;
