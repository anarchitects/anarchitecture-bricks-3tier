import type {
  NewsletterNativeSubscriber,
  NewsletterConsentWithdrawnEvent,
} from '@anarchitects/newsletter-ts/models';

export const NATIVE_SUBSCRIBER_REPOSITORY_PORT = Symbol(
  'newsletter.native-subscriber-repository',
);
export type NewsletterNativeTokenPurpose = 'confirm' | 'unsubscribe';

/** Never contains a raw bearer secret. */
export interface NewsletterNativeTokenRecord {
  readonly hash: string;
  readonly subscriberId: string;
  readonly generation: string;
  readonly purpose: NewsletterNativeTokenPurpose;
  readonly expiresAt: Date;
  readonly consumedAt: Date | null;
}

export interface NewsletterNativeTransaction {
  readonly subscriber: NewsletterNativeSubscriber | null;
  readonly token: NewsletterNativeTokenRecord | null;
  saveSubscriber(subscriber: NewsletterNativeSubscriber): Promise<void>;
  saveToken(token: NewsletterNativeTokenRecord): Promise<void>;
  deleteTokens(
    subscriberId: string,
    purpose?: NewsletterNativeTokenPurpose,
  ): Promise<void>;
  appendWithdrawal(event: NewsletterConsentWithdrawnEvent): Promise<void>;
}

/** All reads and writes, including evidence, commit/roll back together under a scope+email lock. */
export interface NativeSubscriberRepositoryPort {
  transact<T>(
    scope: string,
    selector: { readonly email: string } | { readonly tokenHash: string },
    operation: (transaction: NewsletterNativeTransaction) => Promise<T>,
  ): Promise<T>;
}
