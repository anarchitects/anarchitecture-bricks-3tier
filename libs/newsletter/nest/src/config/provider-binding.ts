import type { InjectionToken, Provider } from '@nestjs/common';
import {
  NewsletterOptionsError,
  type NewsletterProviderBinding,
} from './module-options';

/** Preserve only supported binding fields; Newsletter owns its injection tokens. */
export function bindNewsletterProvider(
  provide: InjectionToken,
  binding: NewsletterProviderBinding,
): Provider {
  if (
    !binding ||
    ['useValue', 'useExisting', 'useFactory'].filter((key) =>
      Object.prototype.hasOwnProperty.call(binding, key),
    ).length !== 1
  )
    throw new NewsletterOptionsError();
  if ('useValue' in binding) return { provide, useValue: binding.useValue };
  if ('useExisting' in binding && binding.useExisting)
    return { provide, useExisting: binding.useExisting };
  if ('useFactory' in binding && typeof binding.useFactory === 'function')
    return { provide, useFactory: binding.useFactory, inject: binding.inject };
  throw new NewsletterOptionsError();
}

export function requireNewsletterMethods<T>(
  value: unknown,
  methods: readonly string[],
): T {
  if (
    !value ||
    !methods.every(
      (method) =>
        typeof (value as Record<string, unknown>)[method] === 'function',
    )
  )
    throw new NewsletterOptionsError();
  return value as T;
}
