import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import type {
  NewsletterConsentGrantedEvent,
  NewsletterConsentWithdrawnEvent,
} from '@anarchitects/newsletter-ts/models';
import type {
  ConsentRepositoryPort,
  NewsletterWithdrawalOutcome,
} from '../../application/ports/consent-repository.port';
import { NewsletterConsentEntity } from '../entities/newsletter-consent.entity';
import {
  NEWSLETTER_CONSENT_TABLE,
  NEWSLETTER_EVENT_IDENTITY_CONSTRAINT,
  NEWSLETTER_SCHEMA,
} from '../schema';

/** PostgreSQL adapter. Each call commits independently through the host DataSource. */
export class TypeOrmConsentRepository implements ConsentRepositoryPort {
  constructor(private readonly dataSource: DataSource) {
    if (dataSource.options.type !== 'postgres') {
      throw new Error('Newsletter consent persistence requires PostgreSQL.');
    }
  }

  async appendGrant(event: NewsletterConsentGrantedEvent): Promise<void> {
    // Insert only; do not use save/upsert or spread caller-controlled properties.
    await this.dataSource.getRepository(NewsletterConsentEntity).insert({
      id: randomUUID(),
      kind: 'granted',
      email: event.email,
      consentVersion: event.consentVersion,
      consentText: event.consentText,
      source: event.source ?? null,
      ipAddress: event.ipAddress ?? null,
      eventSource: null,
      dedupeKey: null,
      recordedAt: event.recordedAt,
    });
  }

  async appendWithdrawalOnce(
    event: NewsletterConsentWithdrawnEvent,
  ): Promise<NewsletterWithdrawalOutcome> {
    // A targeted PostgreSQL conflict clause preserves all other constraint and
    // storage errors. Identity and evidence are the same atomic insert, including
    // under concurrent delivery. No read-before-write, broad orIgnore or update.
    const rows = await this.dataSource.query<{ id: string }[]>(
      `INSERT INTO "${NEWSLETTER_SCHEMA}"."${NEWSLETTER_CONSENT_TABLE}"
        ("id", "kind", "email", "recorded_at", "event_source", "dedupe_key")
       VALUES ($1, 'withdrawn', $2, $3, $4, $5)
       ON CONFLICT ON CONSTRAINT "${NEWSLETTER_EVENT_IDENTITY_CONSTRAINT}"
       DO NOTHING RETURNING "id"`,
      [
        randomUUID(),
        event.email,
        event.recordedAt,
        event.eventSource,
        event.dedupeKey,
      ],
    );
    return rows.length === 1 ? 'recorded' : 'duplicate';
  }
}
