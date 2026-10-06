import { HttpErrorResponse } from '@angular/common/http';

export type NewsletterFailureCode =
  | 'invalid_request'
  | 'rate_limited'
  | 'unavailable';
/** Safe metadata only. Never retain a response body, submitted value, or original cause. */
export class NewsletterApiError extends Error {
  override readonly name = 'NewsletterApiError';
  constructor(
    readonly code: NewsletterFailureCode,
    readonly retryAfterSeconds?: number,
  ) {
    super('Unable to accept the newsletter request.');
  }
}

export function newsletterApiError(error: unknown): NewsletterApiError {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 400) return new NewsletterApiError('invalid_request');
    if (error.status === 429) {
      const header = error.headers.get('Retry-After')?.trim();
      let seconds: number | undefined;
      if (header && /^\d+$/.test(header)) seconds = Number(header);
      else if (header && /^[A-Za-z]{3},/.test(header))
        seconds = Math.max(
          0,
          Math.ceil((Date.parse(header) - Date.now()) / 1000),
        );
      return new NewsletterApiError(
        'rate_limited',
        seconds !== undefined && Number.isSafeInteger(seconds) && seconds >= 0
          ? seconds
          : undefined,
      );
    }
  }
  return new NewsletterApiError('unavailable');
}
