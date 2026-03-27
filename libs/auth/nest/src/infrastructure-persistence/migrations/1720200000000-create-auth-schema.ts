import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';
import { AUTH_SCHEMA } from '../schema';

const USERS_TABLE = `${AUTH_SCHEMA}.users`;
const ROLES_TABLE = `${AUTH_SCHEMA}.roles`;
const PERMISSIONS_TABLE = `${AUTH_SCHEMA}.permissions`;
const USER_ROLES_TABLE = `${AUTH_SCHEMA}.user_roles`;
const ROLE_PERMISSIONS_TABLE = `${AUTH_SCHEMA}.role_permissions`;
const INVALIDATED_TOKENS_TABLE = `${AUTH_SCHEMA}.invalidated_tokens`;
const ACCOUNTS_TABLE = `${AUTH_SCHEMA}.accounts`;
const SESSIONS_TABLE = `${AUTH_SCHEMA}.sessions`;
const VERIFICATIONS_TABLE = `${AUTH_SCHEMA}.verifications`;

export class CreateAuthSchema1720200000000 implements MigrationInterface {
  name = 'CreateAuthSchema1720200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema(AUTH_SCHEMA, true);

    if (!(await queryRunner.hasTable(USERS_TABLE))) {
      await queryRunner.createTable(
        new Table({
          schema: AUTH_SCHEMA,
          name: 'users',
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true },
            {
              name: 'email',
              type: 'varchar',
              length: '255',
              isNullable: false,
              isUnique: true,
            },
            {
              name: 'name',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'emailVerified',
              type: 'boolean',
              default: false,
              isNullable: false,
            },
            {
              name: 'image',
              type: 'varchar',
              length: '500',
              isNullable: true,
            },
            {
              name: 'createdAt',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'updatedAt',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
          ],
        }),
        true,
      );
    }

    if (!(await queryRunner.hasTable(ROLES_TABLE))) {
      await queryRunner.createTable(
        new Table({
          schema: AUTH_SCHEMA,
          name: 'roles',
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true },
            {
              name: 'name',
              type: 'varchar',
              length: '100',
              isNullable: false,
              isUnique: true,
            },
            { name: 'description', type: 'text', isNullable: true },
            {
              name: 'createdAt',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'updatedAt',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
          ],
        }),
        true,
      );
    }

    if (!(await queryRunner.hasTable(PERMISSIONS_TABLE))) {
      await queryRunner.createTable(
        new Table({
          schema: AUTH_SCHEMA,
          name: 'permissions',
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true },
            {
              name: 'name',
              type: 'varchar',
              length: '100',
              isNullable: false,
              isUnique: true,
            },
            { name: 'description', type: 'text', isNullable: true },
            {
              name: 'action',
              type: 'varchar',
              length: '100',
              isNullable: false,
            },
            {
              name: 'subject',
              type: 'varchar',
              length: '100',
              isNullable: false,
            },
            { name: 'conditions', type: 'jsonb', isNullable: true },
            { name: 'fields', type: 'jsonb', isNullable: true },
            {
              name: 'inverted',
              type: 'boolean',
              default: false,
              isNullable: false,
            },
            { name: 'reason', type: 'text', isNullable: true },
            {
              name: 'createdAt',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'updatedAt',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
          ],
        }),
        true,
      );
    }

    if (!(await queryRunner.hasTable(USER_ROLES_TABLE))) {
      await queryRunner.createTable(
        new Table({
          schema: AUTH_SCHEMA,
          name: 'user_roles',
          columns: [
            { name: 'user_id', type: 'uuid', isPrimary: true },
            { name: 'role_id', type: 'uuid', isPrimary: true },
          ],
          foreignKeys: [
            new TableForeignKey({
              name: 'fk_auth_user_roles_user_id',
              columnNames: ['user_id'],
              referencedTableName: USERS_TABLE,
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
            new TableForeignKey({
              name: 'fk_auth_user_roles_role_id',
              columnNames: ['role_id'],
              referencedTableName: ROLES_TABLE,
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
          ],
        }),
        true,
      );
    }

    if (!(await queryRunner.hasTable(ROLE_PERMISSIONS_TABLE))) {
      await queryRunner.createTable(
        new Table({
          schema: AUTH_SCHEMA,
          name: 'role_permissions',
          columns: [
            { name: 'role_id', type: 'uuid', isPrimary: true },
            { name: 'permission_id', type: 'uuid', isPrimary: true },
          ],
          foreignKeys: [
            new TableForeignKey({
              name: 'fk_auth_role_permissions_role_id',
              columnNames: ['role_id'],
              referencedTableName: ROLES_TABLE,
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
            new TableForeignKey({
              name: 'fk_auth_role_permissions_permission_id',
              columnNames: ['permission_id'],
              referencedTableName: PERMISSIONS_TABLE,
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
          ],
        }),
        true,
      );
    }

    if (!(await queryRunner.hasTable(INVALIDATED_TOKENS_TABLE))) {
      await queryRunner.createTable(
        new Table({
          schema: AUTH_SCHEMA,
          name: 'invalidated_tokens',
          columns: [
            {
              name: 'tokenId',
              type: 'varchar',
              length: '128',
              isPrimary: true,
            },
            { name: 'userId', type: 'uuid', isNullable: true },
            {
              name: 'expires_at',
              type: 'timestamptz',
              isNullable: false,
            },
            {
              name: 'invalidated_at',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
          ],
        }),
        true,
      );
    }

    await ensureIndex(queryRunner, INVALIDATED_TOKENS_TABLE, 'invalidated_tokens_expires_at_idx', [
      'expires_at',
    ]);

    if (!(await queryRunner.hasTable(ACCOUNTS_TABLE))) {
      await queryRunner.createTable(
        new Table({
          schema: AUTH_SCHEMA,
          name: 'accounts',
          columns: [
            { name: 'id', type: 'varchar', length: '255', isPrimary: true },
            {
              name: 'accountId',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'providerId',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            { name: 'userId', type: 'uuid', isNullable: false },
            { name: 'accessToken', type: 'text', isNullable: true },
            { name: 'refreshToken', type: 'text', isNullable: true },
            { name: 'idToken', type: 'text', isNullable: true },
            { name: 'accessTokenExpiresAt', type: 'timestamptz', isNullable: true },
            { name: 'refreshTokenExpiresAt', type: 'timestamptz', isNullable: true },
            { name: 'scope', type: 'varchar', length: '500', isNullable: true },
            { name: 'password', type: 'varchar', length: '500', isNullable: true },
            {
              name: 'createdAt',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'updatedAt',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
          ],
          foreignKeys: [
            new TableForeignKey({
              name: 'FK_auth_accounts_userId',
              columnNames: ['userId'],
              referencedTableName: USERS_TABLE,
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
          ],
          uniques: [
            {
              name: 'UQ_auth_accounts_provider_account',
              columnNames: ['providerId', 'accountId'],
            },
          ],
        }),
        true,
      );
    }

    await ensureIndex(queryRunner, ACCOUNTS_TABLE, 'IDX_auth_accounts_userId', [
      'userId',
    ]);

    if (!(await queryRunner.hasTable(SESSIONS_TABLE))) {
      await queryRunner.createTable(
        new Table({
          schema: AUTH_SCHEMA,
          name: 'sessions',
          columns: [
            { name: 'id', type: 'varchar', length: '255', isPrimary: true },
            { name: 'userId', type: 'uuid', isNullable: false },
            { name: 'expiresAt', type: 'timestamptz', isNullable: false },
            {
              name: 'token',
              type: 'varchar',
              length: '500',
              isNullable: false,
              isUnique: true,
            },
            { name: 'ipAddress', type: 'varchar', length: '255', isNullable: true },
            { name: 'userAgent', type: 'varchar', length: '1000', isNullable: true },
            {
              name: 'createdAt',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'updatedAt',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
          ],
          foreignKeys: [
            new TableForeignKey({
              name: 'FK_auth_sessions_userId',
              columnNames: ['userId'],
              referencedTableName: USERS_TABLE,
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
          ],
        }),
        true,
      );
    }

    await ensureIndex(queryRunner, SESSIONS_TABLE, 'IDX_auth_sessions_userId', [
      'userId',
    ]);

    if (!(await queryRunner.hasTable(VERIFICATIONS_TABLE))) {
      await queryRunner.createTable(
        new Table({
          schema: AUTH_SCHEMA,
          name: 'verifications',
          columns: [
            { name: 'id', type: 'varchar', length: '255', isPrimary: true },
            {
              name: 'identifier',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'value',
              type: 'varchar',
              length: '500',
              isNullable: false,
            },
            { name: 'expiresAt', type: 'timestamptz', isNullable: false },
            {
              name: 'createdAt',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'updatedAt',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
          ],
        }),
        true,
      );
    }

    await ensureIndex(
      queryRunner,
      VERIFICATIONS_TABLE,
      'IDX_auth_verifications_identifier',
      ['identifier'],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable(VERIFICATIONS_TABLE)) {
      await queryRunner.dropTable(VERIFICATIONS_TABLE, true, true, true);
    }

    if (await queryRunner.hasTable(SESSIONS_TABLE)) {
      await queryRunner.dropTable(SESSIONS_TABLE, true, true, true);
    }

    if (await queryRunner.hasTable(ACCOUNTS_TABLE)) {
      await queryRunner.dropTable(ACCOUNTS_TABLE, true, true, true);
    }

    if (await queryRunner.hasTable(ROLE_PERMISSIONS_TABLE)) {
      await queryRunner.dropTable(ROLE_PERMISSIONS_TABLE, true, true, true);
    }

    if (await queryRunner.hasTable(USER_ROLES_TABLE)) {
      await queryRunner.dropTable(USER_ROLES_TABLE, true, true, true);
    }

    if (await queryRunner.hasTable(INVALIDATED_TOKENS_TABLE)) {
      await queryRunner.dropTable(INVALIDATED_TOKENS_TABLE, true, true, true);
    }

    if (await queryRunner.hasTable(PERMISSIONS_TABLE)) {
      await queryRunner.dropTable(PERMISSIONS_TABLE, true, true, true);
    }

    if (await queryRunner.hasTable(ROLES_TABLE)) {
      await queryRunner.dropTable(ROLES_TABLE, true, true, true);
    }

    if (await queryRunner.hasTable(USERS_TABLE)) {
      await queryRunner.dropTable(USERS_TABLE, true, true, true);
    }
  }
}

const ensureIndex = async (
  queryRunner: QueryRunner,
  tableName: string,
  indexName: string,
  columnNames: string[],
): Promise<void> => {
  const table = await queryRunner.getTable(tableName);
  const hasIndex = table?.indices.some((index) => index.name === indexName);

  if (!hasIndex) {
    await queryRunner.createIndex(
      tableName,
      new TableIndex({
        name: indexName,
        columnNames,
        isUnique: false,
      }),
    );
  }
};
