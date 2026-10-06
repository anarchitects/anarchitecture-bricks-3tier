import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { NEWSLETTER_CONFIG } from '@anarchitects/newsletter-angular/config';
import {
  NewsletterApi,
  NewsletterApiError,
  type NewsletterFailureCode,
} from '@anarchitects/newsletter-angular/data-access';
import type {
  NewsletterSubscriptionRequestDTO,
  NewsletterSubscriptionResponseDTO,
} from '@anarchitects/newsletter-ts/dtos';
import { catchError, firstValueFrom, map, of, Subject, takeUntil } from 'rxjs';

export type NewsletterSubmissionState =
  | { readonly status: 'idle' }
  | { readonly status: 'submitting' }
  | { readonly status: 'success' }
  | {
      readonly status: 'failure';
      readonly code: NewsletterFailureCode;
      readonly retryAfterSeconds?: number;
    };

function failureState(
  error: unknown,
): Extract<NewsletterSubmissionState, { status: 'failure' }> {
  const failure =
    error instanceof NewsletterApiError
      ? error
      : new NewsletterApiError('unavailable');
  return {
    status: 'failure',
    code: failure.code,
    ...(failure.retryAfterSeconds !== undefined
      ? { retryAfterSeconds: failure.retryAfterSeconds }
      : {}),
  };
}

@Injectable()
export class NewsletterStore {
  private readonly api = inject(NewsletterApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly submissionState = signal<NewsletterSubmissionState>({
    status: 'idle',
  });
  private readonly cancel = new Subject<void>();
  private generation = 0;
  private destroyed = false;

  readonly consent = inject(NEWSLETTER_CONFIG).consent;
  readonly state = this.submissionState.asReadonly();
  readonly status = computed(() => this.state().status);
  readonly submitting = computed(() => this.status() === 'submitting');

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.reset();
      this.cancel.complete();
    });
  }

  /** Ignores overlapping calls. Success means accepted, never confirmed or newly subscribed. */
  async submit(
    request: NewsletterSubscriptionRequestDTO,
  ): Promise<NewsletterSubscriptionResponseDTO | undefined> {
    if (this.destroyed || this.submitting()) return undefined;
    const generation = ++this.generation;
    this.submissionState.set({ status: 'submitting' });
    try {
      const outcome = await firstValueFrom(
        this.api.subscribe(request).pipe(
          map(
            (response): NewsletterSubmissionState =>
              response?.accepted === true
                ? { status: 'success' }
                : failureState(undefined),
          ),
          catchError((error: unknown) => of(failureState(error))),
          takeUntil(this.cancel),
        ),
        { defaultValue: failureState(undefined) },
      );
      if (generation !== this.generation) return undefined;
      this.submissionState.set(outcome);
      return outcome.status === 'success' ? { accepted: true } : undefined;
    } catch (error: unknown) {
      // A replaced client may throw synchronously before returning an Observable.
      if (generation === this.generation)
        this.submissionState.set(failureState(error));
      return undefined;
    }
  }

  /** Cancel observation and clear local state; cannot undo a request already processed by the server. */
  reset(): void {
    this.generation++;
    this.cancel.next();
    this.submissionState.set({ status: 'idle' });
  }
}
