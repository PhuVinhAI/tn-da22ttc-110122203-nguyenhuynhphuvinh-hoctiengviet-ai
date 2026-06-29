import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPhoneticColumns20260609120000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vocabularies_search`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vocabularies_search
      ON vocabularies
      USING gin(to_tsvector('english',
        COALESCE(word, '') || ' ' ||
        COALESCE(translation, '')
      ))
    `);

    await queryRunner.query(
      `ALTER TABLE vocabularies DROP COLUMN IF EXISTS phonetic`,
    );
    await queryRunner.query(
      `ALTER TABLE personal_vocabularies DROP COLUMN IF EXISTS phonetic`,
    );
    await queryRunner.query(
      `ALTER TABLE lesson_contents DROP COLUMN IF EXISTS phonetic`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE lesson_contents ADD COLUMN phonetic varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE personal_vocabularies ADD COLUMN phonetic varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE vocabularies ADD COLUMN phonetic varchar`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS idx_vocabularies_search`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vocabularies_search
      ON vocabularies
      USING gin(to_tsvector('english',
        COALESCE(word, '') || ' ' ||
        COALESCE(translation, '') || ' ' ||
        COALESCE(phonetic, '')
      ))
    `);
  }
}
