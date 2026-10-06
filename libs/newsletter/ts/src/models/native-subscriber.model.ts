/** Operational state, distinct from append-only consent evidence. Not a public signup response. */
export type NewsletterNativeSubscriberStatus =
  | 'pending_confirmation'
  | 'active'
  | 'unsubscribed';

export interface NewsletterNativeSubscriber {
  readonly id: string;
  readonly scope: string;
  readonly email: string;
  readonly status: NewsletterNativeSubscriberStatus;
  /** Changes on resubscription after withdrawal; prior tokens never authorize this generation. */
  readonly generation: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastTokenIssuedAt: Date;
}
