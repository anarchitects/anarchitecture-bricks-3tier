import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { IDENTITY_SCHEMA } from '../schema';

const USER_PROFILES_TABLE = `${IDENTITY_SCHEMA}.user_profiles`;

export class CreateIdentitySchema1720400000000 implements MigrationInterface {
  name = 'CreateIdentitySchema1720400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema(IDENTITY_SCHEMA, true);

    if (!(await queryRunner.hasTable(USER_PROFILES_TABLE))) {
      await queryRunner.createTable(
        new Table({
          schema: IDENTITY_SCHEMA,
          name: 'user_profiles',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
            },
            {
              name: 'auth_user_id',
              type: 'uuid',
              isNullable: false,
              isUnique: true,
            },
            {
              name: 'display_name',
              type: 'varchar',
              length: '150',
              isNullable: true,
            },
            {
              name: 'given_name',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'family_name',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'avatar_url',
              type: 'varchar',
              length: '500',
              isNullable: true,
            },
            {
              name: 'locale',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'time_zone',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'updated_at',
              type: 'timestamptz',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
          ],
        }),
        true,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable(USER_PROFILES_TABLE)) {
      await queryRunner.dropTable(USER_PROFILES_TABLE, true, true, true);
    }
  }
}
