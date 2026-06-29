import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVocabularySearchIndex20260331102600 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add GIN index for full-text search on word, translation, and phonetic
    // This significantly improves search performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vocabularies_search 
      ON vocabularies 
      USING gin(to_tsvector('english', 
        COALESCE(word, '') || ' ' || 
        COALESCE(translation, '') || ' ' || 
        COALESCE(phonetic, '')
      ))
    `);

    // Add regular indexes for ILIKE queries (fallback)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vocabularies_word 
      ON vocabularies (word)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vocabularies_translation 
      ON vocabularies (translation)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vocabularies_search`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vocabularies_word`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_vocabularies_translation`,
    );
  }
}
