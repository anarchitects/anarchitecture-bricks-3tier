import { NewsletterSubscriptionRequestSchema } from '@anarchitects/newsletter-ts/dtos';
import type { NewsletterWithdrawalEvent } from '@anarchitects/newsletter-ts/models';
import { Value } from '@sinclair/typebox/value';
import type { ConsentRepositoryPort } from './ports/consent-repository.port';
import { type NewsletterClock, recordingTime } from './newsletter-clock';
import {
  NewsletterUnavailableError,
  NewsletterValidationError,
} from './newsletter.errors';

export interface NewsletterWithdrawalResult {
  readonly recorded: number;
  readonly duplicates: number;
}

export class NewsletterWithdrawalService {
  constructor(
    private readonly consentRepository: ConsentRepositoryPort,
    private readonly clock: NewsletterClock = () => new Date(),
  ) {}

  /**
   * Accept verified, normalized events from a trusted adapter, never raw webhooks.
   * Validate/snapshot the whole batch before writing; then commit sequentially.
   * On storage failure stop and reject. Retrying the same batch skips committed
   * identities through the repository's durable append-once operation.
   */
  async process(
    events: readonly NewsletterWithdrawalEvent[],
  ): Promise<NewsletterWithdrawalResult> {
    if (!Array.isArray(events)) {
      throw new NewsletterValidationError('invalid_withdrawal');
    }
    const pending = Array.from(events, (event) => {
      if (
        !event ||
        !Value.Check(
          NewsletterSubscriptionRequestSchema.properties.email,
          event.email,
        ) ||
        typeof event.eventSource !== 'string' ||
        !event.eventSource.trim() ||
        typeof event.dedupeKey !== 'string' ||
        !event.dedupeKey.trim()
      ) {
        throw new NewsletterValidationError('invalid_withdrawal');
      }
      return {
        email: event.email.toLowerCase(),
        // Identity is opaque: never trim, lowercase or reconstruct it here.
        eventSource: event.eventSource,
        dedupeKey: event.dedupeKey,
      };
    });

    let recorded = 0;
    let duplicates = 0;
    for (const event of pending) {
      const recordedAt = recordingTime(this.clock);
      try {
        const outcome = await this.consentRepository.appendWithdrawalOnce({
          ...event,
          kind: 'withdrawn',
          recordedAt,
        });
        if (outcome === 'recorded') recorded++;
        else if (outcome === 'duplicate') duplicates++;
        else throw new Error('Invalid repository outcome');
      } catch {
        throw new NewsletterUnavailableError('consent_storage_unavailable');
      }
    }
    return { recorded, duplicates };
  }
}
