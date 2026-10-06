import type {
  ExistingProvider,
  FactoryProvider,
  InjectionToken,
  ModuleMetadata,
  ValueProvider,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { NewsletterConsentPolicy } from '@anarchitects/newsletter-ts/models';
import type {
  MailerLiteSubscriberOptions,
  MailerLiteWebhookOptions,
} from './mailerlite-options';

/** Standard Nest binding without the token owned by Newsletter. */
export type NewsletterProviderBinding =
  | Pick<ValueProvider<unknown>, 'useValue'>
  | Pick<ExistingProvider, 'useExisting'>
  | Pick<FactoryProvider, 'useFactory' | 'inject'>;

export interface NewsletterRateLimitPolicy {
  readonly limit: number;
  readonly windowMs: number;
}
export type NewsletterRateLimitOptions =
  | { readonly mode: 'disabled' }
  | ({
      readonly mode: 'memory';
      readonly maxKeys?: number;
    } & NewsletterRateLimitPolicy)
  | ({
      readonly mode: 'custom';
      readonly provider: NewsletterProviderBinding;
    } & NewsletterRateLimitPolicy);

export interface NewsletterPresentationOptions {
  /** Relative capability prefix; defaults to newsletter. Global prefixes remain host-owned. */
  readonly path?: string;
  /** Required when limiting is enabled. Host owns identity and trusted-proxy policy. */
  readonly resolveClientKey?: (
    request: FastifyRequest,
  ) => string | undefined | Promise<string | undefined>;
  /** Optional trusted evidence. Defaults to recording no request context. */
  readonly resolveContext?: (
    request: FastifyRequest,
  ) =>
    | { readonly ipAddress?: string }
    | Promise<{ readonly ipAddress?: string }>;
}
export interface NewsletterModuleOptions {
  readonly imports?: ModuleMetadata['imports'];
  readonly consent: NewsletterConsentPolicy;
  readonly persistence:
    | { readonly mode: 'custom'; readonly provider: NewsletterProviderBinding }
    | { readonly mode: 'typeorm'; readonly dataSourceToken: InjectionToken };
  readonly subscriber:
    | { readonly mode: 'custom'; readonly provider: NewsletterProviderBinding }
    | { readonly mode: 'noop' }
    | {
        readonly mode: 'mailerlite';
        readonly options: MailerLiteSubscriberOptions;
      };
  /** Absent/false exposes no webhook route. Independent of subscriber selection. */
  readonly webhook?: false | MailerLiteWebhookOptions;
  readonly rateLimit: NewsletterRateLimitOptions;
  readonly presentation?: NewsletterPresentationOptions;
}
export type NewsletterModuleOverrides = Omit<
  Partial<NewsletterModuleOptions>,
  'consent'
> & {
  readonly consent?: Partial<NewsletterConsentPolicy>;
};

export class NewsletterOptionsError extends Error {
  override readonly name = 'NewsletterOptionsError';
  constructor() {
    super('Invalid Newsletter module configuration.');
  }
}

export function validateNewsletterOptions(
  options: NewsletterModuleOptions,
): void {
  if (
    typeof options?.consent?.version !== 'string' ||
    !options.consent.version.trim() ||
    typeof options.consent.text !== 'string' ||
    !options.consent.text.trim() ||
    !['custom', 'typeorm'].includes(options.persistence?.mode) ||
    !['custom', 'noop', 'mailerlite'].includes(options.subscriber?.mode) ||
    !['disabled', 'memory', 'custom'].includes(options.rateLimit?.mode)
  )
    throw new NewsletterOptionsError();
  if (
    options.persistence.mode === 'typeorm' &&
    !options.persistence.dataSourceToken
  )
    throw new NewsletterOptionsError();
  validateNewsletterPresentationOptions(
    options.rateLimit,
    options.presentation,
  );
}

export function validateNewsletterPresentationOptions(
  rateLimit: NewsletterRateLimitOptions,
  presentation?: NewsletterPresentationOptions,
): void {
  const positive = (value: unknown) =>
    typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
  if (!['disabled', 'memory', 'custom'].includes(rateLimit?.mode))
    throw new NewsletterOptionsError();
  if (
    rateLimit.mode !== 'disabled' &&
    (!positive(rateLimit.limit) ||
      !positive(rateLimit.windowMs) ||
      typeof presentation?.resolveClientKey !== 'function')
  )
    throw new NewsletterOptionsError();
  if (
    rateLimit.mode === 'memory' &&
    rateLimit.maxKeys !== undefined &&
    !positive(rateLimit.maxKeys)
  )
    throw new NewsletterOptionsError();
  if (
    presentation?.path !== undefined &&
    (typeof presentation.path !== 'string' ||
      !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*(?![\s\S])/.test(presentation.path))
  )
    throw new NewsletterOptionsError();
  if (
    presentation?.resolveContext !== undefined &&
    typeof presentation.resolveContext !== 'function'
  )
    throw new NewsletterOptionsError();
}
