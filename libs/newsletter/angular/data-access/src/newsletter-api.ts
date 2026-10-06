import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { NEWSLETTER_CONFIG } from '@anarchitects/newsletter-angular/config';
import type {
  NewsletterSubscriptionRequestDTO,
  NewsletterSubscriptionResponseDTO,
} from '@anarchitects/newsletter-ts/dtos';
import { catchError, map, throwError, timeout, type Observable } from 'rxjs';
import { NewsletterApiError, newsletterApiError } from './newsletter-api.error';

@Injectable()
export class NewsletterApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(NEWSLETTER_CONFIG);

  /** One cold POST per subscription. Host config owns routing; HttpClient owns interceptors. */
  subscribe(
    request: NewsletterSubscriptionRequestDTO,
  ): Observable<NewsletterSubscriptionResponseDTO> {
    // Snapshot only contract fields. Do not synthesize affirmative consent, a policy version or normalized email.
    const body: NewsletterSubscriptionRequestDTO = {
      email: request.email,
      consent: request.consent,
      consentVersion: request.consentVersion,
      ...(request.source !== undefined ? { source: request.source } : {}),
      ...(request.website !== undefined ? { website: request.website } : {}),
    };
    return this.http
      .post<unknown>(this.config.subscriptionUrl, body, {
        transferCache: false,
      })
      .pipe(
        timeout(this.config.requestTimeoutMs),
        map((response): NewsletterSubscriptionResponseDTO => {
          if (
            !response ||
            typeof response !== 'object' ||
            !('accepted' in response) ||
            response.accepted !== true
          )
            throw new NewsletterApiError('unavailable');
          // Never pass through status, account details, or additional server fields.
          return { accepted: true };
        }),
        catchError((error: unknown) =>
          throwError(() => newsletterApiError(error)),
        ),
      );
  }
}
