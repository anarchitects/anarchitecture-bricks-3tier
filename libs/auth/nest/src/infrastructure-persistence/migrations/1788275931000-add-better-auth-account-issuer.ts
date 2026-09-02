import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableUnique,
} from 'typeorm';
import { AUTH_SCHEMA } from '../schema';

const ACCOUNTS_TABLE = `${AUTH_SCHEMA}.accounts`;
const CREDENTIAL_PROVIDER_ID = 'credential';
const CREDENTIAL_ISSUER = 'local:credential';
const ISSUER_LENGTH = 255;
const LEGACY_UNIQUE_NAME = 'UQ_auth_accounts_provider_account';
const ISSUER_UNIQUE_NAME = 'UQ_auth_accounts_issuer_account';

type ProviderRow = {
  providerId: string | null;
};

type CountRow = {
  count: string | number;
};

export class AddBetterAuthAccountIssuer1788275931000
  implements MigrationInterface
{
  name = 'AddBetterAuthAccountIssuer1788275931000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const accounts = await queryRunner.getTable(ACCOUNTS_TABLE);
    if (!accounts) {
      throw new Error(
        `Cannot migrate Better Auth account identity because ${ACCOUNTS_TABLE} does not exist.`,
      );
    }

    if (!accounts.findColumnByName('issuer')) {
      await queryRunner.addColumn(
        ACCOUNTS_TABLE,
        new TableColumn({
          name: 'issuer',
          type: 'varchar',
          length: String(ISSUER_LENGTH),
          isNullable: true,
        }),
      );
    }

    await this.backfillIssuers(queryRunner);
    await this.assertNoMissingIssuers(queryRunner);
    await this.assertNoIssuerAccountCollisions(queryRunner);

    const refreshedAccounts = await queryRunner.getTable(ACCOUNTS_TABLE);
    if (!refreshedAccounts) {
      throw new Error(`Unable to reload ${ACCOUNTS_TABLE} during migration.`);
    }

    const legacyUnique = refreshedAccounts.uniques.find(
      (unique) => unique.name === LEGACY_UNIQUE_NAME,
    );
    if (legacyUnique) {
      await queryRunner.dropUniqueConstraint(ACCOUNTS_TABLE, legacyUnique);
    }

    const issuerColumn = refreshedAccounts.findColumnByName('issuer');
    if (!issuerColumn) {
      throw new Error(`Unable to resolve ${ACCOUNTS_TABLE}.issuer.`);
    }
    if (issuerColumn.isNullable) {
      await queryRunner.query(
        `ALTER TABLE "${AUTH_SCHEMA}"."accounts"
           ALTER COLUMN "issuer" SET NOT NULL`,
      );
    }

    const constrainedAccounts = await queryRunner.getTable(ACCOUNTS_TABLE);
    if (
      !constrainedAccounts?.uniques.some(
        (unique) => unique.name === ISSUER_UNIQUE_NAME,
      )
    ) {
      await queryRunner.createUniqueConstraint(
        ACCOUNTS_TABLE,
        new TableUnique({
          name: ISSUER_UNIQUE_NAME,
          columnNames: ['issuer', 'accountId'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const accounts = await queryRunner.getTable(ACCOUNTS_TABLE);
    if (!accounts?.findColumnByName('issuer')) {
      return;
    }

    await this.assertNoProviderAccountCollisions(queryRunner);

    const issuerUnique = accounts.uniques.find(
      (unique) => unique.name === ISSUER_UNIQUE_NAME,
    );
    if (issuerUnique) {
      await queryRunner.dropUniqueConstraint(ACCOUNTS_TABLE, issuerUnique);
    }

    const refreshedAccounts = await queryRunner.getTable(ACCOUNTS_TABLE);
    if (
      !refreshedAccounts?.uniques.some(
        (unique) => unique.name === LEGACY_UNIQUE_NAME,
      )
    ) {
      await queryRunner.createUniqueConstraint(
        ACCOUNTS_TABLE,
        new TableUnique({
          name: LEGACY_UNIQUE_NAME,
          columnNames: ['providerId', 'accountId'],
        }),
      );
    }

    await queryRunner.dropColumn(ACCOUNTS_TABLE, 'issuer');
  }

  private async backfillIssuers(queryRunner: QueryRunner): Promise<void> {
    const providers = (await queryRunner.query(
      `SELECT DISTINCT "providerId" FROM "${AUTH_SCHEMA}"."accounts"`,
    )) as ProviderRow[];

    for (const { providerId } of providers) {
      if (!providerId) {
        throw new Error(
          'Better Auth 1.7 account migration found an account without providerId.',
        );
      }

      const issuer = toProviderIssuer(providerId);
      if (issuer.length > ISSUER_LENGTH) {
        throw new Error(
          `Better Auth issuer for provider "${providerId}" exceeds ${ISSUER_LENGTH} characters.`,
        );
      }

      const conflictingRows = (await queryRunner.query(
        `SELECT COUNT(*)::int AS "count"
           FROM "${AUTH_SCHEMA}"."accounts"
          WHERE "providerId" = $1
            AND "issuer" IS NOT NULL
            AND "issuer" <> $2`,
        [providerId, issuer],
      )) as CountRow[];

      if (Number(conflictingRows[0]?.count ?? 0) > 0) {
        throw new Error(
          `Better Auth account migration found a non-provider-id issuer for provider "${providerId}".`,
        );
      }

      await queryRunner.query(
        `UPDATE "${AUTH_SCHEMA}"."accounts"
            SET "issuer" = $1
          WHERE "providerId" = $2
            AND "issuer" IS NULL`,
        [issuer, providerId],
      );
    }
  }

  private async assertNoMissingIssuers(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const rows = (await queryRunner.query(
      `SELECT COUNT(*)::int AS "count"
         FROM "${AUTH_SCHEMA}"."accounts"
        WHERE "issuer" IS NULL`,
    )) as CountRow[];

    if (Number(rows[0]?.count ?? 0) > 0) {
      throw new Error(
        'Better Auth 1.7 account migration could not backfill every issuer.',
      );
    }
  }

  private async assertNoIssuerAccountCollisions(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const rows = (await queryRunner.query(
      `SELECT COUNT(*)::int AS "count"
         FROM (
           SELECT "issuer", "accountId"
             FROM "${AUTH_SCHEMA}"."accounts"
            GROUP BY "issuer", "accountId"
           HAVING COUNT(*) > 1
         ) collisions`,
    )) as CountRow[];

    if (Number(rows[0]?.count ?? 0) > 0) {
      throw new Error(
        'Better Auth 1.7 account migration found duplicate (issuer, accountId) identities.',
      );
    }
  }

  private async assertNoProviderAccountCollisions(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const rows = (await queryRunner.query(
      `SELECT COUNT(*)::int AS "count"
         FROM (
           SELECT "providerId", "accountId"
             FROM "${AUTH_SCHEMA}"."accounts"
            GROUP BY "providerId", "accountId"
           HAVING COUNT(*) > 1
         ) collisions`,
    )) as CountRow[];

    if (Number(rows[0]?.count ?? 0) > 0) {
      throw new Error(
        'Cannot roll back Better Auth issuer identity while duplicate (providerId, accountId) rows exist.',
      );
    }
  }
}

function toProviderIssuer(providerId: string): string {
  return providerId === CREDENTIAL_PROVIDER_ID
    ? CREDENTIAL_ISSUER
    : `local:oauth:${encodeURIComponent(providerId)}`;
}
