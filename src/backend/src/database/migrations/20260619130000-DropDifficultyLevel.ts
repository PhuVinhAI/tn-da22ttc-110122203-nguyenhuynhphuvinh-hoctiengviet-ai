import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bỏ trường difficulty_level khỏi vocabularies, grammar_rules, questions.
 * Cũng bỏ các composite index có chứa difficulty_level trên vocabularies và grammar_rules
 * (do TypeORM tự sinh tên, dùng pg_indexes để tìm chính xác và DROP an toàn).
 */
export class DropDifficultyLevel20260619130000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Bỏ các index có chứa cột difficulty_level trên vocabularies và grammar_rules.
    await queryRunner.query(`
      DO $$
      DECLARE
        idx record;
      BEGIN
        FOR idx IN
          SELECT i.relname AS indexname, t.relname AS tablename
          FROM pg_class i
          JOIN pg_index ix ON ix.indexrelid = i.oid
          JOIN pg_class t ON t.oid = ix.indrelid
          JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
          WHERE t.relname IN ('vocabularies', 'grammar_rules')
            AND a.attname = 'difficulty_level'
        LOOP
          EXECUTE format('DROP INDEX IF EXISTS %I', idx.indexname);
        END LOOP;
      END $$;
    `);

    await queryRunner.query(
      `ALTER TABLE "vocabularies" DROP COLUMN IF EXISTS "difficulty_level"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grammar_rules" DROP COLUMN IF EXISTS "difficulty_level"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP COLUMN IF EXISTS "difficulty_level"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vocabularies" ADD COLUMN "difficulty_level" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "grammar_rules" ADD COLUMN "difficulty_level" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD COLUMN "difficulty_level" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vocabularies_lesson_difficulty" ON "vocabularies" ("lesson_id", "difficulty_level")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_grammar_rules_lesson_difficulty" ON "grammar_rules" ("lesson_id", "difficulty_level")`,
    );
  }
}
