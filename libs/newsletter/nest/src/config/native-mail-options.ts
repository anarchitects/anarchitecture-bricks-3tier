import type { MailerMessage } from '@anarchitects/common-nest-mailer';

export interface NewsletterRenderedMail {
  readonly html: string;
  readonly text: string;
}
export interface NewsletterMailPresentation {
  readonly publicationName: string;
}
/** Sensitive URL context: trusted renderer input only, never log or persist. */
export interface NewsletterConfirmationPresentation
  extends NewsletterMailPresentation {
  readonly confirmationUrl: string;
  readonly unsubscribeUrl: string;
}
export interface NewsletterMailDeliveryOutcome {
  readonly kind: 'confirmation' | 'unsubscribed';
  readonly outcome: 'sent' | 'failed';
  readonly attempts: number;
}
export interface NewsletterNativeMailOptions {
  /** Trusted absolute HTTPS endpoints; no credentials, query, or fragment. */
  readonly confirmationUrl: string;
  readonly unsubscribeUrl: string;
  readonly publicationName: string;
  readonly confirmationSubject?: string;
  readonly unsubscribedSubject?: string;
  /** Generic metadata uses Common's contract, not a Newsletter transport abstraction. */
  readonly message?: Pick<MailerMessage, 'from' | 'replyTo' | 'headers'>;
  readonly renderConfirmation?: (
    context: NewsletterConfirmationPresentation,
  ) => NewsletterRenderedMail;
  readonly renderUnsubscribed?: (
    context: NewsletterMailPresentation,
  ) => NewsletterRenderedMail;
  /** Default true. Withdrawal always commits before the optional receipt. */
  readonly notifyUnsubscribe?: boolean;
  /** Total attempts for one rendered message, 1..3, default 1. */
  readonly maxAttempts?: number;
  /** Delay between attempts, 0..5000 ms, default 250. Transport timeouts belong to Common. */
  readonly retryDelayMs?: number;
  /** Aggregate operational hook: no email, URL, token, or provider error. Must be synchronous. */
  readonly onDeliveryOutcome?: (outcome: NewsletterMailDeliveryOutcome) => void;
}
