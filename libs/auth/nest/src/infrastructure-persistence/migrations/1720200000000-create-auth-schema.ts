import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';
import { AUTH_SCHEMA } from '../schema';

const USERS_TABLE = `${AUTH_SCHEMA}.users`;
const ROLES_TABLE = `${AUTH_SCHEMA}.roles`;
const PERMISSIONS_TABLE = `${AUTH_SCHEMA}.permissions`;
const USER_ROLES_TABLE = `${AUTH_SCHEMA}.user_roles`;
const ROLE_PERMISSIONS_TABLE = `${AUTH_SCHEMA}.role_permissions`;
const INVALIDATED_TOKENS_TABLE = `${AUTH_SCHEMA}.invalidated_tokens`;

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
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
            },
            {
              name: 'email',
              type: 'varchar',
              length: '255',
              isNullable: false,
              isUnique: true,
            },
            {
              name: 'userName',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'passwordHash',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'token',
              type: 'varchar',
              length: '500',
              isNullable: true,
            },
            {
              name: 'isActive',
              type: 'boolean',
              default: false,
              isNullable: false,
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
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
            },
            {
              name: 'name',
              type: 'varchar',
              length: '100',
              isNullable: false,
              isUnique: true,
            },
            {
              name: 'description',
              type: 'text',
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

    if (!(await queryRunner.hasTable(PERMISSIONS_TABLE))) {
      await queryRunner.createTable(
        new Table({
          schema: AUTH_SCHEMA,
          name: 'permissions',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
            },
            {
              name: 'name',
              type: 'varchar',
              length: '100',
              isNullable: false,
              isUnique: true,
            },
            {
              name: 'description',
              type: 'text',
              isNullable: true,
            },
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
            {
              name: 'conditions',
              type: 'jsonb',
              isNullable: true,
            },
            {
              name: 'fields',
              type: 'jsonb',
              isNullable: true,
            },
            {
              name: 'inverted',
              type: 'boolean',
              default: false,
              isNullable: false,
            },
            {
              name: 'reason',
              type: 'text',
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

    if (!(await queryRunner.hasTable(USER_ROLES_TABLE))) {
      await queryRunner.createTable(
        new Table({
          schema: AUTH_SCHEMA,
          name: 'user_roles',
          columns: [
            {
              name: 'user_id',
              type: 'uuid',
              isPrimary: true,
            },
            {
              name: 'role_id',
              type: 'uuid',
              isPrimary: true,
            },
          ],
          foreignKeys: [
            {
              name: 'fk_auth_user_roles_user_id',
              columnNames: ['user_id'],
              referencedTableName: USERS_TABLE,
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
            {
              name: 'fk_auth_user_roles_role_id',
              columnNames: ['role_id'],
              referencedTableName: ROLES_TABLE,
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
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
            {
              name: 'role_id',
              type: 'uuid',
              isPrimary: true,
            },
            {
              name: 'permission_id',
              type: 'uuid',
              isPrimary: true,
            },
          ],
          foreignKeys: [
            {
              name: 'fk_auth_role_permissions_role_id',
              columnNames: ['role_id'],
              referencedTableName: ROLES_TABLE,
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
            {
              name: 'fk_auth_role_permissions_permission_id',
              columnNames: ['permission_id'],
              referencedTableName: PERMISSIONS_TABLE,
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
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
            {
              name: 'userId',
              type: 'uuid',
              isNullable: true,
            },
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

    const invalidatedTokensIndexName = 'invalidated_tokens_expires_at_idx';
    const invalidatedTokensTable = await queryRunner.getTable(
      INVALIDATED_TOKENS_TABLE,
    );
    const hasInvalidatedTokensIndex = invalidatedTokensTable?.indices.some(
      (index) => index.name === invalidatedTokensIndexName,
    );

    if (!hasInvalidatedTokensIndex) {
      await queryRunner.createIndex(
        INVALIDATED_TOKENS_TABLE,
        new TableIndex({
          name: invalidatedTokensIndexName,
          columnNames: ['expires_at'],
          isUnique: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
