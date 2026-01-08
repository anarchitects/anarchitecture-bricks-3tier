import { MigrationInterface, QueryRunner } from 'typeorm';
import { AUTH_SCHEMA } from '../schema';

export class CreateInvalidatedTokensCacheTable1720200000000
  implements MigrationInterface
{
  name = 'CreateInvalidatedTokensCacheTable1720200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${AUTH_SCHEMA}";`);

    await queryRunner.query(`
      CREATE UNLOGGED TABLE IF NOT EXISTS "${AUTH_SCHEMA}"."invalidated_tokens" (
        token_id varchar(128) PRIMARY KEY,
        user_id uuid NULL,
        expires_at timestamptz NOT NULL,
        invalidated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS invalidated_tokens_expires_at_idx
        ON "${AUTH_SCHEMA}"."invalidated_tokens" (expires_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "${AUTH_SCHEMA}"."invalidated_tokens";`
    );
  }
}
