import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';
import { AUTH_SCHEMA } from '../../../../../infrastructure-persistence/schema';

const PASSKEYS_TABLE = `${AUTH_SCHEMA}.passkeys`;
const USERS_TABLE = `${AUTH_SCHEMA}.users`;

export class CreateBetterAuthPasskeysTable1760200001000
  implements MigrationInterface
{
  name = 'CreateBetterAuthPasskeysTable1760200001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable(PASSKEYS_TABLE))) {
      await queryRunner.createTable(
        new Table({
          schema: AUTH_SCHEMA,
          name: 'passkeys',
          columns: [
            { name: 'id', type: 'varchar', length: '255', isPrimary: true },
            { name: 'name', type: 'varchar', length: '255', isNullable: true },
            { name: 'publicKey', type: 'text', isNullable: false },
            { name: 'userId', type: 'uuid', isNullable: false },
            {
              name: 'credentialID',
              type: 'varchar',
              length: '500',
              isNullable: false,
            },
            { name: 'counter', type: 'integer', isNullable: false },
            {
              name: 'deviceType',
              type: 'varchar',
              length: '100',
              isNullable: false,
            },
            { name: 'backedUp', type: 'boolean', isNullable: false },
            {
              name: 'transports',
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
            { name: 'aaguid', type: 'varchar', length: '255', isNullable: true },
          ],
          foreignKeys: [
            new TableForeignKey({
              name: 'FK_auth_passkeys_userId',
              columnNames: ['userId'],
              referencedTableName: USERS_TABLE,
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
          ],
          uniques: [
            {
              name: 'UQ_auth_passkeys_credentialID',
              columnNames: ['credentialID'],
            },
          ],
        }),
        true,
      );
    }

    const table = await queryRunner.getTable(PASSKEYS_TABLE);
    const hasIndex = table?.indices.some(
      (index) => index.name === 'IDX_auth_passkeys_userId',
    );

    if (!hasIndex) {
      await queryRunner.createIndex(
        PASSKEYS_TABLE,
        new TableIndex({
          name: 'IDX_auth_passkeys_userId',
          columnNames: ['userId'],
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable(PASSKEYS_TABLE)) {
      await queryRunner.dropTable(PASSKEYS_TABLE, true, true, true);
    }
  }
}
