import { NewsletterConfigurationError } from './newsletter.errors';

/** Server-owned clock; never use a browser/provider timestamp as recording time. */
export type NewsletterClock = () => Date;

export function recordingTime(clock: NewsletterClock): Date {
  const value = clock();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new NewsletterConfigurationError();
  }
  return new Date(value.getTime());
}
