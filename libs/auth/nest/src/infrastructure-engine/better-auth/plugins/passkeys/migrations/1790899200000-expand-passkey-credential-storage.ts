import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Widen existing columns in place; never recreate enrolled credentials. */
export class ExpandPasskeyCredentialStorage1790899200000
  implements MigrationInterface
{
  name = 'ExpandPasskeyCredentialStorage1790899200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // One statement also preserves atomicity when the host disables migration transactions.
    await queryRunner.query(`ALTER TABLE "auth"."passkeys"
      ALTER COLUMN "credentialID" TYPE varchar(1364),
      ALTER COLUMN "counter" TYPE bigint,
      ADD CONSTRAINT "CHK_auth_passkeys_counter_uint32"
        CHECK ("counter" >= 0 AND "counter" <= 4294967295)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const incompatible =
      await queryRunner.query(`SELECT 1 FROM "auth"."passkeys"
      WHERE "counter" > 2147483647 OR char_length("credentialID") > 500 LIMIT 1`);
    if (incompatible.length) {
      throw new Error(
        'Cannot roll back passkey storage: enrolled credentials exceed the legacy counter or credential ID limits.',
      );
    }
    // Do not cast credentialID explicitly: PostgreSQL must reject, not truncate,
    // a long ID written concurrently with the preflight check.
    await queryRunner.query(`ALTER TABLE "auth"."passkeys"
      DROP CONSTRAINT "CHK_auth_passkeys_counter_uint32",
      ALTER COLUMN "counter" TYPE integer,
      ALTER COLUMN "credentialID" TYPE varchar(500)`);
  }
}
