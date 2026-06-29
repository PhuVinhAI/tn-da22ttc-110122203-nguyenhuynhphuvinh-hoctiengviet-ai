import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeExerciseQuestionNullable20260602160000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "exercises" ALTER COLUMN "question" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "exercises" SET "question" = '' WHERE "question" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercises" ALTER COLUMN "question" SET NOT NULL`,
    );
  }
}
