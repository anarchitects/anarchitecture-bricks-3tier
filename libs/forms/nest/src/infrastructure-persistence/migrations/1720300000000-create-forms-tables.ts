import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';
import { FORMS_SCHEMA } from '../schema';

const FORM_CONFIGS_TABLE = `${FORMS_SCHEMA}.form_configs`;
const FORM_SUBMISSIONS_TABLE = `${FORMS_SCHEMA}.form_submissions`;

export class CreateFormsTables1720300000000 implements MigrationInterface {
  name = 'CreateFormsTables1720300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema(FORMS_SCHEMA, true);

    if (!(await queryRunner.hasTable(FORM_CONFIGS_TABLE))) {
      await queryRunner.createTable(
        new Table({
          schema: FORMS_SCHEMA,
          name: 'form_configs',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '100',
              isPrimary: true,
            },
            {
              name: 'version',
              type: 'int',
              isPrimary: true,
            },
            {
              name: 'fields',
              type: 'jsonb',
              isNullable: false,
            },
            {
              name: 'security',
              type: 'jsonb',
              isNullable: true,
            },
            {
              name: 'delivery',
              type: 'jsonb',
              isNullable: true,
            },
          ],
        }),
        true,
      );
    }

    if (!(await queryRunner.hasTable(FORM_SUBMISSIONS_TABLE))) {
      await queryRunner.createTable(
        new Table({
          schema: FORMS_SCHEMA,
          name: 'form_submissions',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
            },
            {
              name: 'formId',
              type: 'varchar',
              length: '100',
              isNullable: false,
            },
            {
              name: 'formVersion',
              type: 'int',
              isNullable: false,
            },
            {
              name: 'payload',
              type: 'jsonb',
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

    const submissionsFormIndex = 'idx_form_submissions_form_id_version';
    const submissionsTable = await queryRunner.getTable(FORM_SUBMISSIONS_TABLE);
    const hasSubmissionsFormIndex = submissionsTable?.indices.some(
      (index) => index.name === submissionsFormIndex,
    );

    if (!hasSubmissionsFormIndex) {
      await queryRunner.createIndex(
        FORM_SUBMISSIONS_TABLE,
        new TableIndex({
          name: submissionsFormIndex,
          columnNames: ['formId', 'formVersion'],
          isUnique: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable(FORM_SUBMISSIONS_TABLE)) {
      await queryRunner.dropTable(FORM_SUBMISSIONS_TABLE, true, true, true);
    }

    if (await queryRunner.hasTable(FORM_CONFIGS_TABLE)) {
      await queryRunner.dropTable(FORM_CONFIGS_TABLE, true, true, true);
    }
  }
}
