import { Check, Column, Entity, PrimaryColumn, Unique } from 'typeorm';
import type { NewsletterNativeSubscriberStatus } from '@anarchitects/newsletter-ts/models';

@Entity({ schema: 'newsletter', name: 'native_subscribers' })
@Unique('uq_newsletter_native_subscriber_identity', ['scope', 'email'])
@Check(
  'ck_newsletter_native_subscriber_status',
  `"status" IN ('pending_confirmation', 'active', 'unsubscribed')`,
)
@Check(
  'ck_newsletter_native_subscriber_identity',
  `btrim("scope") <> '' AND "email" = lower("email")`,
)
export class NewsletterNativeSubscriberEntity {
  @PrimaryColumn('uuid', {
    primaryKeyConstraintName: 'pk_newsletter_native_subscribers',
  })
  id!: string;
  @Column({ type: 'varchar', length: 128 }) scope!: string;
  @Column({ type: 'varchar', length: 254 }) email!: string;
  @Column({ type: 'varchar', length: 24 })
  status!: NewsletterNativeSubscriberStatus;
  @Column({ type: 'uuid' }) generation!: string;
  @Column({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @Column({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @Column({ name: 'last_token_issued_at', type: 'timestamptz' })
  lastTokenIssuedAt!: Date;
}
