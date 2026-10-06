import { InjectionToken, type Provider } from '@angular/core';
import type { NewsletterConsentPolicy } from '@anarchitects/newsletter-ts/models';

export interface NewsletterConfig {
  /** Host-owned policy matching the backend. No legal wording is supplied by the library. */
  readonly consent: NewsletterConsentPolicy;
  /** Origin and/or global API prefix, e.g. /api or https://api.example.test/v1. Default: same origin, no prefix. */
  readonly apiBaseUrl?: string;
  /** Capability prefix, matching the Nest presentation path. Default: newsletter. */
  readonly apiResourcePath?: string;
  /** Request deadline in milliseconds (1–2147483647); default 10000. No automatic retries. */
  readonly requestTimeoutMs?: number;
}
export interface ResolvedNewsletterConfig {
  readonly consent: NewsletterConsentPolicy;
  readonly subscriptionUrl: string;
  readonly requestTimeoutMs: number;
}
export const NEWSLETTER_CONFIG = new InjectionToken<ResolvedNewsletterConfig>(
  'NEWSLETTER_CONFIG',
);

export function resolveNewsletterConfig(
  config: NewsletterConfig,
): ResolvedNewsletterConfig {
  const invalid = () => new Error('Invalid Newsletter client configuration.');
  if (
    typeof config?.consent?.version !== 'string' ||
    !config.consent.version.trim() ||
    typeof config.consent.text !== 'string' ||
    !config.consent.text.trim()
  )
    throw invalid();
  const base = config.apiBaseUrl ?? '';
  const path = config.apiResourcePath ?? 'newsletter';
  const timeout = config.requestTimeoutMs ?? 10000;
  if (
    typeof base !== 'string' ||
    /[\s?#\\]/.test(base) ||
    typeof path !== 'string' ||
    !Number.isSafeInteger(timeout) ||
    timeout <= 0 ||
    timeout > 2147483647
  )
    throw invalid();
  if (base && base !== '/') {
    if (/^https?:\/\//.test(base)) {
      let parsed: URL;
      try {
        parsed = new URL(base);
      } catch {
        throw invalid();
      }
      if (!parsed.hostname || parsed.username || parsed.password)
        throw invalid();
    } else if (!/^\/(?!\/)/.test(base)) throw invalid();
  }
  const resource = path.replace(/^\/+|\/+$/g, '');
  if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*(?![\s\S])/.test(resource))
    throw invalid();
  return Object.freeze({
    consent: Object.freeze({
      version: config.consent.version,
      text: config.consent.text,
    }),
    subscriptionUrl: `${base.replace(/\/+$/, '')}/${resource}/subscribe`,
    requestTimeoutMs: timeout,
  });
}

/** Explicit provider; usable at application, route or component scope. */
export function provideNewsletterConfig(config: NewsletterConfig): Provider[] {
  return [
    { provide: NEWSLETTER_CONFIG, useValue: resolveNewsletterConfig(config) },
  ];
}
