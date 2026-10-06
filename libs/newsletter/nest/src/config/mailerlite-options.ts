export interface MailerLiteSubscriberOptions {
  readonly apiKey: string;
  readonly groupId: string;
  /** Optional existing MailerLite custom field receiving request.source. */
  readonly sourceField?: string;
  /** Per-attempt timeout; default 5000ms, maximum 30000ms. */
  readonly timeoutMs?: number;
  /** Includes the initial request; default 2, maximum 3. */
  readonly maxAttempts?: number;
  /** Exponential retry base; default 250ms, maximum 1000ms. */
  readonly retryDelayMs?: number;
  /** Maximum acceptable Retry-After/backoff; default 2000ms, maximum 30000ms. */
  readonly maxRetryDelayMs?: number;
}

export interface MailerLiteSubscriberDependencies {
  readonly fetch?: typeof fetch;
  readonly sleep?: (milliseconds: number) => Promise<void>;
}

export interface MailerLiteWebhookOptions {
  readonly webhookSecret: string;
  /** Stable MailerLite account ID; never use a webhook ID or secret as the namespace. */
  readonly accountId: string;
  /** Default 1 MiB; must be between 1 byte and 10 MiB. Ingress should also limit body size. */
  readonly maxBodyBytes?: number;
  /** Default 1000, maximum 10000. */
  readonly maxEvents?: number;
}
