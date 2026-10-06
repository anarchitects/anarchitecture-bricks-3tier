import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import type { NewsletterNativeTokenPurpose } from '../../application';
import { NewsletterNativeSubscriberEntity } from './newsletter-native-subscriber.entity';

@Entity({ schema: 'newsletter', name: 'native_tokens' })
@Unique('uq_newsletter_native_token_purpose', ['subscriberId', 'purpose'])
@Check(
  'ck_newsletter_native_token_shape',
  `"hash" ~ '^[0-9a-f]{64}$' AND "purpose" IN ('confirm', 'unsubscribe')`,
)
export class NewsletterNativeTokenEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 64,
    primaryKeyConstraintName: 'pk_newsletter_native_tokens',
  })
  hash!: string;
  @Column({ name: 'subscriber_id', type: 'uuid' }) subscriberId!: string;
  @Column({ type: 'uuid' }) generation!: string;
  @Column({ type: 'varchar', length: 16 })
  purpose!: NewsletterNativeTokenPurpose;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt!: Date;
  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt!: Date | null;
  // Same-domain relation only; no entity from another domain is imported.
  @ManyToOne(() => NewsletterNativeSubscriberEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'subscriber_id',
    foreignKeyConstraintName: 'fk_newsletter_native_token_subscriber',
  })
  subscriber?: NewsletterNativeSubscriberEntity;
}
