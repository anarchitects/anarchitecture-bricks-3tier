import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1761494616754 implements MigrationInterface {
  name = 'Init1761494616754';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA "forms"`);
    await queryRunner.query(
      `CREATE TABLE "forms"."form_submissions" ("id" uuid NOT NULL, "form_id" character varying(100) NOT NULL, "form_version" integer NOT NULL, "payload" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fb6e1e9f26cda31c358a8a1530e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_fb6e1e9f26cda31c358a8a1530" ON "forms"."form_submissions" ("id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "forms"."IDX_fb6e1e9f26cda31c358a8a1530"`,
    );
    await queryRunner.query(`DROP TABLE "forms"."form_submissions"`);
  }
}
