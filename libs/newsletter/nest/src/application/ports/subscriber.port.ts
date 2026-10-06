/** DI token for host/facade composition; the application has no Nest dependency. */
export const SUBSCRIBER_PORT = Symbol('newsletter.subscriber');

export interface NewsletterSubscriberRequest {
  readonly email: string;
  readonly source?: string;
}

export interface SubscriberPort {
  /**
   * Request provider-managed double opt-in. Never force confirmation or bypass
   * an existing opt-out. New, existing and opted-out addresses must not produce
   * distinguishable success results or existence-related errors.
   *
   * Resolve without provider status/identifiers. Reject only for operational
   * failure; adapters own timeouts, bounded retries and private diagnostics.
   * Calls may repeat after retries; exactly-once delivery is not guaranteed.
   */
  subscribe(request: NewsletterSubscriberRequest): Promise<void>;
}
