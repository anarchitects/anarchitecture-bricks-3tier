import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type {
  NativeTokenPort,
  NewsletterNativeTokenPurpose,
} from '../application';

/** 256-bit random bearer tokens, purpose prefix, SHA-256 verifiers; no reusable raw secret is persisted. */
export class CryptoNativeToken implements NativeTokenPort {
  newId(): string {
    return randomUUID();
  }
  issue(purpose: NewsletterNativeTokenPurpose): {
    secret: string;
    hash: string;
  } {
    const secret = `v1.${purpose === 'confirm' ? 'c' : 'u'}.${randomBytes(32).toString('base64url')}`;
    return { secret, hash: this.digest(secret, purpose) };
  }
  hash(
    secret: unknown,
    purpose: NewsletterNativeTokenPurpose,
  ): string | undefined {
    if (
      typeof secret !== 'string' ||
      secret.length !== 48 ||
      !/^v1\.[cu]\.[A-Za-z0-9_-]{43}$/.test(secret) ||
      secret[3] !== (purpose === 'confirm' ? 'c' : 'u')
    )
      return undefined;
    return this.digest(secret, purpose);
  }
  private digest(
    secret: string,
    purpose: NewsletterNativeTokenPurpose,
  ): string {
    return createHash('sha256')
      .update(`newsletter:${purpose}:${secret}`)
      .digest('hex');
  }
}
