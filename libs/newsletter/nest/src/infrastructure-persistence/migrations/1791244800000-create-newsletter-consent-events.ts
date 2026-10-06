import { type MigrationInterface, type QueryRunner, Table } from 'typeorm';

// Keep migration definitions frozen instead of importing evolving entity metadata.
export class CreateNewsletterConsentEvents1791244800000
  implements MigrationInterface
{
  name = 'CreateNewsletterConsentEvents1791244800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema('newsletter', true);
    await queryRunner.createTable(
      new Table({
        schema: 'newsletter',
        name: 'consent_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            primaryKeyConstraintName: 'pk_newsletter_consent_events',
          },
          { name: 'email', type: 'varchar', length: '254' },
          { name: 'kind', type: 'varchar', length: '16' },
          { name: 'consent_version', type: 'text', isNullable: true },
          { name: 'consent_text', type: 'text', isNullable: true },
          { name: 'source', type: 'text', isNullable: true },
          { name: 'event_source', type: 'text', isNullable: true },
          { name: 'dedupe_key', type: 'text', isNullable: true },
          { name: 'ip_address', type: 'text', isNullable: true },
          { name: 'recorded_at', type: 'timestamptz' },
        ],
        uniques: [
          {
            name: 'uq_newsletter_consent_event_identity',
            columnNames: ['event_source', 'dedupe_key'],
          },
        ],
        indices: [
          {
            name: 'ix_newsletter_consent_email_recorded_at',
            columnNames: ['email', 'recorded_at'],
          },
        ],
        checks: [
          {
            name: 'ck_newsletter_consent_event_shape',
            expression: `
          ("kind" = 'granted'
            AND "consent_version" IS NOT NULL AND btrim("consent_version") <> ''
            AND "consent_text" IS NOT NULL AND btrim("consent_text") <> ''
            AND "event_source" IS NULL AND "dedupe_key" IS NULL)
          OR
          ("kind" = 'withdrawn'
            AND "event_source" IS NOT NULL AND btrim("event_source") <> ''
            AND "dedupe_key" IS NOT NULL AND btrim("dedupe_key") <> ''
            AND "consent_version" IS NULL AND "consent_text" IS NULL
            AND "source" IS NULL AND "ip_address" IS NULL)
        `,
          },
        ],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('newsletter.consent_events');
    // The namespace may contain other host-owned objects; never drop it here.
  }
}
