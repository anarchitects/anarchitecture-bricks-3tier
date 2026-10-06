import { Check, Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';
import {
  NEWSLETTER_CONSENT_TABLE,
  NEWSLETTER_EVENT_IDENTITY_CONSTRAINT,
  NEWSLETTER_EVENT_SHAPE,
  NEWSLETTER_EVENT_SHAPE_CONSTRAINT,
  NEWSLETTER_SCHEMA,
} from '../schema';

/** Infrastructure record for host DataSource registration and restricted audits. */
@Entity({ schema: NEWSLETTER_SCHEMA, name: NEWSLETTER_CONSENT_TABLE })
@Unique(NEWSLETTER_EVENT_IDENTITY_CONSTRAINT, ['eventSource', 'dedupeKey'])
@Check(NEWSLETTER_EVENT_SHAPE_CONSTRAINT, NEWSLETTER_EVENT_SHAPE)
@Index('ix_newsletter_consent_email_recorded_at', ['email', 'recordedAt'])
export class NewsletterConsentEntity {
  @PrimaryColumn('uuid', {
    primaryKeyConstraintName: 'pk_newsletter_consent_events',
  })
  id!: string;

  @Column({ type: 'varchar', length: 254 })
  email!: string;

  @Column({ type: 'varchar', length: 16 })
  kind!: 'granted' | 'withdrawn';

  @Column({ name: 'consent_version', type: 'text', nullable: true })
  consentVersion!: string | null;

  @Column({ name: 'consent_text', type: 'text', nullable: true })
  consentText!: string | null;

  @Column({ type: 'text', nullable: true })
  source!: string | null;

  @Column({ name: 'event_source', type: 'text', nullable: true })
  eventSource!: string | null;

  @Column({ name: 'dedupe_key', type: 'text', nullable: true })
  dedupeKey!: string | null;

  @Column({ name: 'ip_address', type: 'text', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt!: Date;
}
