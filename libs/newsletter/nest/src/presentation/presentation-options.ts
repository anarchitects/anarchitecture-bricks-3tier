import type { ModuleMetadata } from '@nestjs/common';
import type {
  NewsletterPresentationOptions,
  NewsletterRateLimitOptions,
} from '../config/module-options';
import type { NewsletterWithdrawalResult } from '../application/withdrawal.service';

export const NEWSLETTER_PRESENTATION_OPTIONS = Symbol(
  'newsletter.presentation-options',
);
export const NEWSLETTER_WEBHOOK_HANDLER = Symbol('newsletter.webhook-handler');
export interface NewsletterWebhookHandler {
  receive(
    rawBody: Uint8Array | undefined,
    signature: unknown,
  ): Promise<NewsletterWithdrawalResult>;
}
export interface NewsletterPresentationModuleOptions
  extends NewsletterPresentationOptions {
  readonly imports?: ModuleMetadata['imports'];
  readonly rateLimit: NewsletterRateLimitOptions;
  readonly webhookEnabled?: boolean;
  /** Requires NATIVE_NEWSLETTER_ACTIONS from the host/runtime imports. */
  readonly nativeEnabled?: boolean;
}
