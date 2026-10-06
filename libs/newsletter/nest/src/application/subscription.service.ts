import {
  NewsletterSubscriptionRequestSchema,
  type NewsletterSubscriptionResponseDTO,
} from '@anarchitects/newsletter-ts/dtos';
import type { NewsletterConsentPolicy } from '@anarchitects/newsletter-ts/models';
import { Value } from '@sinclair/typebox/value';
import type { ConsentRepositoryPort } from './ports/consent-repository.port';
import type { SubscriberPort } from './ports/subscriber.port';
import { type NewsletterClock, recordingTime } from './newsletter-clock';
import {
  NewsletterConfigurationError,
  NewsletterUnavailableError,
  NewsletterValidationError,
} from './newsletter.errors';

export interface NewsletterSubscriptionContext {
  /** Optional evidence supplied only by a host's trusted request-context resolver. */
  readonly ipAddress?: string;
}

export class NewsletterSubscriptionService {
  private readonly policy: NewsletterConsentPolicy;

  constructor(
    private readonly consentRepository: ConsentRepositoryPort,
    private readonly subscriber: SubscriberPort,
    policy: NewsletterConsentPolicy,
    private readonly clock: NewsletterClock = () => new Date(),
  ) {
    if (
      !policy ||
      typeof policy.version !== 'string' ||
      !policy.version.trim() ||
      typeof policy.text !== 'string' ||
      !policy.text.trim()
    ) {
      throw new NewsletterConfigurationError();
    }
    // Keep exact host wording/version and prevent later config mutation.
    this.policy = { version: policy.version, text: policy.text };
  }

  async subscribe(
    request: unknown,
    context: NewsletterSubscriptionContext = {},
  ): Promise<NewsletterSubscriptionResponseDTO> {
    // Presentation handles this before HTTP schema validation too. Keep direct
    // application callers from accidentally creating evidence for a honeypot.
    if (
      request !== null &&
      typeof request === 'object' &&
      'website' in request &&
      typeof request.website === 'string' &&
      request.website.length > 0
    ) {
      return { accepted: true };
    }
    if (!Value.Check(NewsletterSubscriptionRequestSchema, request)) {
      throw new NewsletterValidationError('invalid_request');
    }
    if (request.consentVersion !== this.policy.version) {
      throw new NewsletterValidationError('consent_policy_mismatch');
    }
    if (
      !context ||
      (context.ipAddress !== undefined &&
        (typeof context.ipAddress !== 'string' || !context.ipAddress.trim()))
    ) {
      throw new NewsletterValidationError('invalid_context');
    }

    // Snapshot before awaiting persistence. Canonicalization is consistent for
    // grants, provider requests and withdrawals; no provider-specific rewriting.
    const email = request.email.toLowerCase();
    const attribution =
      request.source === undefined ? {} : { source: request.source };
    const evidence =
      context.ipAddress === undefined ? {} : { ipAddress: context.ipAddress };
    const recordedAt = recordingTime(this.clock);
    try {
      await this.consentRepository.appendGrant({
        kind: 'granted',
        email,
        recordedAt,
        consentVersion: this.policy.version,
        consentText: this.policy.text,
        ...attribution,
        ...evidence,
      });
    } catch {
      throw new NewsletterUnavailableError('consent_storage_unavailable');
    }

    try {
      await this.subscriber.subscribe({ email, ...attribution });
    } catch {
      // There is intentionally no rollback across the repository/provider boundary.
      throw new NewsletterUnavailableError('subscriber_unavailable');
    }
    return { accepted: true };
  }
}
