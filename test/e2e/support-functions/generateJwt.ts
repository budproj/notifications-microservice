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
