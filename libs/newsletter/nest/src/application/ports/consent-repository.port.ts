import type {
  NewsletterConsentGrantedEvent,
  NewsletterConsentWithdrawnEvent,
} from '@anarchitects/newsletter-ts/models';

export const CONSENT_REPOSITORY_PORT = Symbol('newsletter.consent-repository');

export type NewsletterWithdrawalOutcome = 'recorded' | 'duplicate';

export interface ConsentRepositoryPort {
  /** Resolve only after the grant is committed. Repeated attempts append grants. */
  appendGrant(event: NewsletterConsentGrantedEvent): Promise<void>;

  /**
   * Commit evidence and identity atomically, unique on (eventSource, dedupeKey).
   * The adapter supplies source/account-scoped identities stable across retries.
   * Only a conflict on that identity is a duplicate; all other failures reject.
   * No prior grant is required. Never overwrite or remove existing evidence.
   * A read-then-insert check or process-local set is insufficient in production.
   */
  appendWithdrawalOnce(
    event: NewsletterConsentWithdrawnEvent,
  ): Promise<NewsletterWithdrawalOutcome>;
}
