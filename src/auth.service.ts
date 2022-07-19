import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { promisify } from 'node:util';

@Injectable()
export class AuthService {
  client: jwksClient.JwksClient;

  private promisifiedVerify = promisify<
    string,
    jwt.Secret | jwt.GetPublicKeyOrSecret,
    jwt.VerifyOptions,
    jwt.JwtPayload
  >(jwt.verify);

  constructor() {
    this.client = jwksClient({
      jwksUri: `${process.env.AUTHZ_ISSUER}.well-known/jwks.json`,
    });
  }

  public getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
    this.client.getSigningKey(header.kid, function (_, key) {
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
