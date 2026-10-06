export type NewsletterValidationCode =
  | 'invalid_request'
  | 'consent_policy_mismatch'
  | 'invalid_context'
  | 'invalid_withdrawal';

/** Presentation may map the code; no submitted values are included. */
export class NewsletterValidationError extends Error {
  override readonly name = 'NewsletterValidationError';

  constructor(readonly code: NewsletterValidationCode) {
    super('Invalid newsletter request.');
  }
}

export class NewsletterConfigurationError extends Error {
  override readonly name = 'NewsletterConfigurationError';

  constructor() {
    super('Invalid newsletter application configuration.');
  }
}

/** Safe operational failure. Adapter exceptions/PII are deliberately not attached. */
export class NewsletterUnavailableError extends Error {
  override readonly name = 'NewsletterUnavailableError';
  readonly retryable = true;

  constructor(
    readonly code: 'consent_storage_unavailable' | 'subscriber_unavailable',
  ) {
    super('Newsletter processing is temporarily unavailable.');
  }
}
