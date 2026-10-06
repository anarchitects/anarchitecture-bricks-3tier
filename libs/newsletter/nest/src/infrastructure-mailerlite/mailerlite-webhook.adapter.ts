import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { TextDecoder } from 'node:util';
import { Value } from '@sinclair/typebox/value';
import { NewsletterSubscriptionRequestSchema } from '@anarchitects/newsletter-ts/dtos';
import type { NewsletterWithdrawalEvent } from '@anarchitects/newsletter-ts/models';
import type {
  NewsletterWithdrawalResult,
  NewsletterWithdrawalService,
} from '../application/withdrawal.service';
import {
  MailerLiteConfigurationError,
  MailerLiteWebhookError,
} from './mailerlite.errors';

export const MAILERLITE_SIGNATURE_HEADER = 'signature';

export interface MailerLiteWebhookOptions {
  readonly webhookSecret: string;
  /** Stable MailerLite account ID; never use a webhook ID or secret as the namespace. */
  readonly accountId: string;
  /** Default 1 MiB; must be between 1 byte and 10 MiB. Ingress should also limit body size. */
  readonly maxBodyBytes?: number;
  /** Default 1000, maximum 10000. */
  readonly maxEvents?: number;
}

type Payload = Record<string, unknown>;
const invalid = () => new MailerLiteWebhookError('invalid_payload');
function object(value: unknown): value is Payload {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function identifier(value: unknown): string | undefined {
  if (typeof value === 'string' && /^\d+(?![\s\S])/.test(value)) return value;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
    return String(value);
  return undefined;
}
function timestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})?$/.test(
      value,
    ) &&
    Number.isFinite(Date.parse(value))
  );
}

/** Verifies and parses the same raw bytes before dispatching any withdrawal. */
export class MailerLiteWebhookAdapter {
  private readonly options: Required<MailerLiteWebhookOptions>;

  constructor(
    options: MailerLiteWebhookOptions,
    private readonly withdrawals: Pick<NewsletterWithdrawalService, 'process'>,
  ) {
    if (
      !options ||
      typeof options.webhookSecret !== 'string' ||
      !options.webhookSecret.trim() ||
      typeof options.accountId !== 'string' ||
      !identifier(options.accountId)
    )
      throw new MailerLiteConfigurationError();
    const maxBodyBytes = options.maxBodyBytes ?? 1024 * 1024;
    const maxEvents = options.maxEvents ?? 1000;
    if (
      !Number.isInteger(maxBodyBytes) ||
      maxBodyBytes < 1 ||
      maxBodyBytes > 10 * 1024 * 1024 ||
      !Number.isInteger(maxEvents) ||
      maxEvents < 1 ||
      maxEvents > 10000
    )
      throw new MailerLiteConfigurationError();
    this.options = {
      webhookSecret: options.webhookSecret,
      accountId: options.accountId,
      maxBodyBytes,
      maxEvents,
    };
  }

  async receive(
    rawBody: Uint8Array | undefined,
    signature: unknown,
  ): Promise<NewsletterWithdrawalResult> {
    if (!(rawBody instanceof Uint8Array))
      throw new MailerLiteWebhookError('missing_raw_body');
    if (rawBody.byteLength > this.options.maxBodyBytes)
      throw new MailerLiteWebhookError('payload_too_large');
    if (
      typeof signature !== 'string' ||
      signature.length !== 64 ||
      !/^[a-f\d]{64}$/i.test(signature)
    )
      throw new MailerLiteWebhookError('invalid_signature');
    const bytes = Buffer.from(rawBody);
    const expected = createHmac('sha256', this.options.webhookSecret)
      .update(bytes)
      .digest();
    if (!timingSafeEqual(Buffer.from(signature, 'hex'), expected))
      throw new MailerLiteWebhookError('invalid_signature');
    let payload: unknown;
    try {
      payload = JSON.parse(
        new TextDecoder('utf-8', { fatal: true }).decode(bytes),
      );
    } catch {
      throw invalid();
    }
    const events = this.normalize(payload);
    // Normalize the entire signed batch before side effects. Persistence failures
    // propagate so ingress can request a retry instead of falsely acknowledging.
    return this.withdrawals.process(events);
  }

  private normalize(payload: unknown): NewsletterWithdrawalEvent[] {
    if (!object(payload)) throw invalid();
    if (
      'account_id' in payload &&
      identifier(payload['account_id']) !== this.options.accountId
    )
      throw invalid();
    const batch = 'events' in payload ? payload['events'] : [payload];
    if (!Array.isArray(batch) || batch.length > this.options.maxEvents)
      throw invalid();
    const events: NewsletterWithdrawalEvent[] = [];
    for (const raw of batch) {
      if (!object(raw)) throw invalid();
      const name = raw['event'] ?? raw['type'];
      if (
        typeof name !== 'string' ||
        !name.trim() ||
        (raw['event'] !== undefined &&
          raw['type'] !== undefined &&
          raw['event'] !== raw['type'])
      )
        throw invalid();
      if (
        'account_id' in raw &&
        identifier(raw['account_id']) !== this.options.accountId
      )
        throw invalid();
      if (name !== 'subscriber.unsubscribed' && name !== 'subscriber.deleted')
        continue;
      const subscriber = 'subscriber' in raw ? raw['subscriber'] : raw;
      if (!object(subscriber)) throw invalid();
      const email = subscriber['email'];
      const id = identifier(subscriber['id']);
      const changedAt =
        name === 'subscriber.unsubscribed'
          ? (subscriber['unsubscribed_at'] ?? subscriber['updated_at'])
          : (subscriber['deleted_at'] ??
            subscriber['forget_at'] ??
            subscriber['updated_at']);
      if (
        !id ||
        !Value.Check(
          NewsletterSubscriptionRequestSchema.properties.email,
          email,
        ) ||
        !timestamp(changedAt)
      )
        throw invalid();
      // MailerLite's id is a SUBSCRIBER ID, not an event ID. Keep occurrence
      // time (including microseconds) to distinguish real repeat withdrawals.
      const identity = JSON.stringify([name, id, changedAt]);
      events.push({
        email: email.toLowerCase(),
        eventSource: `mailerlite:${this.options.accountId}`,
        dedupeKey: `v1:${createHash('sha256').update(identity).digest('hex')}`,
      });
    }
    return events;
  }
}
