import { getJwtConnectionString } from './generate-connection-strings';

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

export const generateValidJwt = async (jwtData: unknown) => {
  const jwtServer = getJwtConnectionString(global.__jwt__);

  const res = await fetch(jwtServer, {
    method: 'POST',
    headers,
    body: JSON.stringify({ claims: jwtData }),
  });

  return res.text();
};

export const generateInvalidJwt = async (jwtData: unknown) => {
  // this simulates "key not found" errors
  const jwtServer = getJwtConnectionString(global.__jwt__);

  const res = await fetch(jwtServer, {
    method: 'POST',
    headers,
    body: JSON.stringify({ claims: jwtData, kid: 'invalidKid' }),
  });

  return res.text();
};