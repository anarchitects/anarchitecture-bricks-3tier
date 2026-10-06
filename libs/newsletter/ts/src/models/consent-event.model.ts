/** Evidence of affirmative consent; this is not confirmation of double opt-in. */
export interface NewsletterConsentGrantedEvent {
  readonly kind: 'granted';
  readonly email: string;
  /** Server recording time, not a timestamp supplied by the browser. */
  readonly recordedAt: Date;
  /** Server-resolved snapshot of the policy accepted by the subscriber. */
  readonly consentVersion: string;
  readonly consentText: string;
  /** Optional attribution, not an authorization or identity claim. */
  readonly source?: string;
  /** Optional host-approved evidence from trusted request context. */
  readonly ipAddress?: string;
}

/** Provider-neutral input after an infrastructure adapter has verified and normalized an event. */
export interface NewsletterWithdrawalEvent {
  readonly email: string;
  /** Opaque source namespace; no provider event-name enum is part of this contract. */
  readonly eventSource: string;
  /** Stable opaque identity scoped to provider source/account and event, reused on retries. */
  readonly dedupeKey: string;
}

/** A withdrawal appends new evidence even when no local grant is known. */
export interface NewsletterConsentWithdrawnEvent
  extends NewsletterWithdrawalEvent {
  readonly kind: 'withdrawn';
  /** Server recording time, distinct from any provider occurrence timestamp. */
  readonly recordedAt: Date;
  /** No consent wording was presented during withdrawal. */
  readonly consentVersion?: never;
  readonly consentText?: never;
}

/** Append-only evidence, not an ORM entity or a public subscriber-status response. */
export type NewsletterConsentEvent =
  | NewsletterConsentGrantedEvent
  | NewsletterConsentWithdrawnEvent;
