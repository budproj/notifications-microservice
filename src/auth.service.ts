import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { promisify } from 'node:util';

@Injectable()
export class AuthService {
  client: jwksClient.JwksClient;

  constructor() {
    this.client = jwksClient({
      jwksUri: `${process.env.AUTHZ_ISSUER}.well-known/jwks.json`,
    });
  }

  private promisifiedVerify = promisify<
    string,
    jwt.Secret | jwt.GetPublicKeyOrSecret,
    jwt.VerifyOptions,
    jwt.JwtPayload
  >(jwt.verify);

  public getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
    this.client.getSigningKey(header.kid, function (_, key) {
      if (!key?.getPublicKey) return callback(new Error('Invalid token'), null);

      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    });
  };

  public async verifyToken(token: string): Promise<jwt.JwtPayload> {
    const decodedToken = await this.promisifiedVerify(token, this.getKey, {
      algorithms: ['RS256'],
    });

    return decodedToken;
  }
}
