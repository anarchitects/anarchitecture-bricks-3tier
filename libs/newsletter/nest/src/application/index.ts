// Reserved entry point. Business APIs are implemented in later epic #428 issues.
export {
  SUBSCRIBER_PORT,
  type SubscriberPort,
  type NewsletterSubscriberRequest,
} from './ports/subscriber.port';
export {
  CONSENT_REPOSITORY_PORT,
  type ConsentRepositoryPort,
  type NewsletterWithdrawalOutcome,
} from './ports/consent-repository.port';
export {
  NewsletterSubscriptionService,
  type NewsletterSubscriptionContext,
} from './subscription.service';
export {
  NewsletterWithdrawalService,
  type NewsletterWithdrawalResult,
} from './withdrawal.service';
export {
  NewsletterConfigurationError,
  NewsletterUnavailableError,
  NewsletterValidationError,
  type NewsletterValidationCode,
} from './newsletter.errors';
export type { NewsletterClock } from './newsletter-clock';
