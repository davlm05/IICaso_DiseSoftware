import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import {
  InvalidQrTokenError,
  QrTokenExpiredError,
} from '../../domain/errors/checkout.errors';
import type {
  IQrSigner,
  QrPayload,
  SignedQr,
} from '../../application/interfaces/qr-signer.interface';

/**
 * HS256 QR signer (README §2.3 §2). 10-minute expiry is the single source of
 * truth (read back from the decoded `exp`); verify allows 10s clock skew.
 */
@Injectable()
export class JwtQrSigner implements IQrSigner {
  private readonly secret: string;

  constructor(config: ConfigService) {
    this.secret = config.getOrThrow<string>('QR_SIGNING_SECRET');
  }

  sign(payload: QrPayload): SignedQr {
    const token = jwt.sign(payload, this.secret, {
      algorithm: 'HS256',
      expiresIn: '10m',
    });
    const decoded = jwt.decode(token) as { exp: number };
    return { token, expiresAt: new Date(decoded.exp * 1000) };
  }

  verify(token: string): QrPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
        clockTolerance: 10,
      }) as jwt.JwtPayload & QrPayload;
      return {
        sessionId: decoded.sessionId,
        userId: decoded.userId,
        itemHash: decoded.itemHash,
      };
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) throw new QrTokenExpiredError();
      throw new InvalidQrTokenError();
    }
  }
}
