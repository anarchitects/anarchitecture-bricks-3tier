import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { FORMS_SCHEMA } from '../schema';

const FORM_CONFIGS_TABLE = `${FORMS_SCHEMA}.form_configs`;
const VALIDATION_RULES_COLUMN = 'validationRules';

export class AddValidationRulesToFormConfigs1720310000000
  implements MigrationInterface
{
  name = 'AddValidationRulesToFormConfigs1720310000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(FORM_CONFIGS_TABLE);
    const hasColumn = table?.findColumnByName(VALIDATION_RULES_COLUMN);

    if (!hasColumn) {
      await queryRunner.addColumn(
        FORM_CONFIGS_TABLE,
        new TableColumn({
          name: VALIDATION_RULES_COLUMN,
          type: 'jsonb',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(FORM_CONFIGS_TABLE);
    const hasColumn = table?.findColumnByName(VALIDATION_RULES_COLUMN);

    if (hasColumn) {
      await queryRunner.dropColumn(FORM_CONFIGS_TABLE, VALIDATION_RULES_COLUMN);
    }
  }
}
