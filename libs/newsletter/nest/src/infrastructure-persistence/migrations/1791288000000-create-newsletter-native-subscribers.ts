import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Frozen schema; run after CreateNewsletterConsentEvents1791244800000. */
export class CreateNewsletterNativeSubscribers1791288000000
  implements MigrationInterface
{
  name = 'CreateNewsletterNativeSubscribers1791288000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema('newsletter', true);
    await queryRunner.query(`CREATE TABLE "newsletter"."native_subscribers" (
      "id" uuid NOT NULL,
      "scope" varchar(128) NOT NULL,
      "email" varchar(254) NOT NULL,
      "status" varchar(24) NOT NULL,
      "generation" uuid NOT NULL,
      "created_at" timestamptz NOT NULL,
      "updated_at" timestamptz NOT NULL,
      "last_token_issued_at" timestamptz NOT NULL,
      CONSTRAINT "pk_newsletter_native_subscribers" PRIMARY KEY ("id"),
      CONSTRAINT "uq_newsletter_native_subscriber_identity" UNIQUE ("scope", "email"),
      CONSTRAINT "ck_newsletter_native_subscriber_status" CHECK ("status" IN ('pending_confirmation', 'active', 'unsubscribed')),
      CONSTRAINT "ck_newsletter_native_subscriber_identity" CHECK (btrim("scope") <> '' AND "email" = lower("email"))
    )`);
    await queryRunner.query(`CREATE TABLE "newsletter"."native_tokens" (
      "hash" varchar(64) NOT NULL,
      "subscriber_id" uuid NOT NULL,
      "generation" uuid NOT NULL,
      "purpose" varchar(16) NOT NULL,
      "expires_at" timestamptz NOT NULL,
      "consumed_at" timestamptz,
      CONSTRAINT "pk_newsletter_native_tokens" PRIMARY KEY ("hash"),
      CONSTRAINT "uq_newsletter_native_token_purpose" UNIQUE ("subscriber_id", "purpose"),
      CONSTRAINT "ck_newsletter_native_token_shape" CHECK ("hash" ~ '^[0-9a-f]{64}$' AND "purpose" IN ('confirm', 'unsubscribe')),
      CONSTRAINT "fk_newsletter_native_token_subscriber" FOREIGN KEY ("subscriber_id") REFERENCES "newsletter"."native_subscribers" ("id") ON DELETE CASCADE
    )`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('newsletter.native_tokens');
    await queryRunner.dropTable('newsletter.native_subscribers');
    // Consent history, its migration and host-owned schema objects are untouched.
  }
}
