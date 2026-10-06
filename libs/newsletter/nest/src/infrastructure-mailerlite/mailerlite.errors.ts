/** Configuration diagnostics never contain credentials or submitted values. */
export class MailerLiteConfigurationError extends Error {
  override readonly name = 'MailerLiteConfigurationError';
  constructor() {
    super('Invalid MailerLite adapter configuration.');
  }
}

/** Presentation owns HTTP mapping; no raw payload, signature or secret is exposed. */
export class MailerLiteWebhookError extends Error {
  override readonly name = 'MailerLiteWebhookError';
  constructor(
    readonly code:
      | 'missing_raw_body'
      | 'invalid_signature'
      | 'invalid_payload'
      | 'payload_too_large',
  ) {
    super('Unable to accept MailerLite webhook.');
  }
}
