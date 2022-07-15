import * as jwt from 'jsonwebtoken';
import { promisify } from 'node:util';

import { AuthService } from './auth.service';

jest.mock('jsonwebtoken');
const mockedJwt = jest.mocked(jwt, true);

jest.mock('node:util');
const mockedPromisify = jest.mocked(promisify, true);

describe('AuthService', () => {
  const service = new AuthService();

  beforeEach(jest.resetAllMocks);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyToken', () => {
    const token =
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const expectedDecodedToken = {
      sub: '1234567890',
      name: 'John Doe',
      iat: 1516239022,
    };

    it('should decode a valid token', async () => {
      const mockedVerifyImplementation = mockedJwt.verify.mockImplementation(
        () => expectedDecodedToken,
      );
      mockedPromisify.mockImplementation(() => mockedVerifyImplementation);

      const decodedToken = await service.verifyToken(token);

      expect(decodedToken).toEqual(expectedDecodedToken);
      expect(mockedVerifyImplementation).toHaveBeenCalledWith(
        token,
        service.getKey,
        {
          algorithms: ['RS256'],
        },
      );
    });
  });
});
