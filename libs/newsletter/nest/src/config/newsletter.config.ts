import { registerAs, type ConfigType } from '@nestjs/config';
import {
  NewsletterOptionsError,
  validateNewsletterOptions,
  type NewsletterModuleOptions,
  type NewsletterModuleOverrides,
} from './module-options';

/** Only this config entry point reads environment variables. Ports remain host supplied. */
export const newsletterConfig = registerAs('newsletter', () => ({
  consentVersion: process.env['NEWSLETTER_CONSENT_VERSION'],
  consentText: process.env['NEWSLETTER_CONSENT_TEXT'],
  subscriber: process.env['NEWSLETTER_SUBSCRIBER'],
  apiKey: process.env['NEWSLETTER_MAILERLITE_API_KEY'],
  groupId: process.env['NEWSLETTER_MAILERLITE_GROUP_ID'],
  accountId: process.env['NEWSLETTER_MAILERLITE_ACCOUNT_ID'],
  webhookSecret: process.env['NEWSLETTER_MAILERLITE_WEBHOOK_SECRET'],
  webhookEnabled: process.env['NEWSLETTER_MAILERLITE_WEBHOOK_ENABLED'],
  rateLimit: process.env['NEWSLETTER_RATE_LIMIT_MODE'],
  limit: process.env['NEWSLETTER_RATE_LIMIT_MAX'],
  windowMs: process.env['NEWSLETTER_RATE_LIMIT_WINDOW_MS'],
  path: process.env['NEWSLETTER_PATH'],
  nativeScope: process.env['NEWSLETTER_NATIVE_SCOPE'],
  confirmationTtlMs: process.env['NEWSLETTER_NATIVE_CONFIRMATION_TTL_MS'],
  unsubscribeTtlMs: process.env['NEWSLETTER_NATIVE_UNSUBSCRIBE_TTL_MS'],
  resendCooldownMs: process.env['NEWSLETTER_NATIVE_RESEND_COOLDOWN_MS'],
  publicationName: process.env['NEWSLETTER_PUBLICATION_NAME'],
  confirmationUrl: process.env['NEWSLETTER_CONFIRMATION_URL'],
  unsubscribeUrl: process.env['NEWSLETTER_UNSUBSCRIBE_URL'],
  confirmationSubject: process.env['NEWSLETTER_CONFIRMATION_SUBJECT'],
  unsubscribedSubject: process.env['NEWSLETTER_UNSUBSCRIBED_SUBJECT'],
  mailFrom: process.env['NEWSLETTER_MAIL_FROM'],
  mailReplyTo: process.env['NEWSLETTER_MAIL_REPLY_TO'],
  notifyUnsubscribe: process.env['NEWSLETTER_NOTIFY_UNSUBSCRIBE'],
  mailMaxAttempts: process.env['NEWSLETTER_MAIL_MAX_ATTEMPTS'],
  mailRetryDelayMs: process.env['NEWSLETTER_MAIL_RETRY_DELAY_MS'],
}));
export type NewsletterConfig = ConfigType<typeof newsletterConfig>;

/** Adapter/limiter choices are atomic overrides; consent/presentation merge field-wise. */
export function mapNewsletterConfigToOptions(
  config: NewsletterConfig,
  overrides: NewsletterModuleOverrides = {},
): NewsletterModuleOptions {
  let subscriber = overrides.subscriber;
  if (!subscriber && config.subscriber) {
    if (config.subscriber === 'noop') subscriber = { mode: 'noop' };
    else if (config.subscriber === 'native') {
      const number = (value: string | undefined) =>
        value === undefined ? undefined : value.trim() ? Number(value) : NaN;
      if (
        config.notifyUnsubscribe !== undefined &&
        !['true', 'false'].includes(config.notifyUnsubscribe)
      )
        throw new NewsletterOptionsError();
      subscriber = {
        mode: 'native',
        options: {
          scope: config.nativeScope ?? '',
          confirmationTtlMs: number(config.confirmationTtlMs),
          unsubscribeTtlMs: number(config.unsubscribeTtlMs),
          resendCooldownMs: number(config.resendCooldownMs),
        },
        mail: {
          publicationName: config.publicationName ?? '',
          confirmationUrl: config.confirmationUrl ?? '',
          unsubscribeUrl: config.unsubscribeUrl ?? '',
          confirmationSubject: config.confirmationSubject,
          unsubscribedSubject: config.unsubscribedSubject,
          message: { from: config.mailFrom, replyTo: config.mailReplyTo },
          notifyUnsubscribe:
            config.notifyUnsubscribe === undefined
              ? undefined
              : config.notifyUnsubscribe === 'true',
          maxAttempts: number(config.mailMaxAttempts),
          retryDelayMs: number(config.mailRetryDelayMs),
        },
      };
    } else if (config.subscriber === 'mailerlite')
      subscriber = {
        mode: 'mailerlite',
        options: { apiKey: config.apiKey ?? '', groupId: config.groupId ?? '' },
      };
    else throw new NewsletterOptionsError();
  }
  let rateLimit = overrides.rateLimit;
  if (!rateLimit && config.rateLimit) {
    if (config.rateLimit === 'disabled') rateLimit = { mode: 'disabled' };
    else if (config.rateLimit === 'memory')
      rateLimit = {
        mode: 'memory',
        limit: Number(config.limit),
        windowMs: Number(config.windowMs),
      };
    else throw new NewsletterOptionsError();
  }
  let webhook = overrides.webhook;
  if (webhook === undefined && config.webhookEnabled !== undefined) {
    if (config.webhookEnabled === 'true')
      webhook = {
        webhookSecret: config.webhookSecret ?? '',
        accountId: config.accountId ?? '',
      };
    else if (config.webhookEnabled === 'false') webhook = false;
    else throw new NewsletterOptionsError();
  }
  if (!overrides.persistence || !subscriber || !rateLimit)
    throw new NewsletterOptionsError();
  const options: NewsletterModuleOptions = {
    ...overrides,
    consent: {
      version: config.consentVersion ?? '',
      text: config.consentText ?? '',
      ...overrides.consent,
    },
    persistence: overrides.persistence,
    subscriber,
    rateLimit,
    webhook,
    presentation: { path: config.path, ...overrides.presentation },
  };
  validateNewsletterOptions(options);
  return options;
}
