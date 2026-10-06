import type { NewsletterNativeTokenPurpose } from './native-subscriber-repository.port';

export const NATIVE_TOKEN_PORT = Symbol('newsletter.native-token');
/** Infrastructure supplies cryptography; application owns purpose, expiry and consumption. */
export interface NativeTokenPort {
  newId(): string;
  issue(purpose: NewsletterNativeTokenPurpose): {
    readonly secret: string;
    readonly hash: string;
  };
  hash(
    secret: unknown,
    purpose: NewsletterNativeTokenPurpose,
  ): string | undefined;
}
