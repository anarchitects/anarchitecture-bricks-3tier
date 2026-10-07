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
export type { NewsletterNativeMailPort } from './ports/native-mail.port';
export {
  NATIVE_NEWSLETTER_ACTIONS,
  type NewsletterNativeActionsPort,
} from './ports/native-actions.port';

export {
  NewsletterNativeLifecycleService,
  type NewsletterNativePreparation,
} from './native-lifecycle.service';
export {
  NATIVE_SUBSCRIBER_REPOSITORY_PORT,
  type NativeSubscriberRepositoryPort,
  type NewsletterNativeTransaction,
  type NewsletterNativeTokenPurpose,
  type NewsletterNativeTokenRecord,
} from './ports/native-subscriber-repository.port';
export {
  NATIVE_TOKEN_PORT,
  type NativeTokenPort,
} from './ports/native-token.port';
