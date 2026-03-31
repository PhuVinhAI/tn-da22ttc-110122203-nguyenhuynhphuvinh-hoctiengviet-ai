import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDialectAndClassifier20260331100000
  implements MigrationInterface
{
  name = 'AddDialectAndClassifier20260331100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create dialect enum type
    await queryRunner.query(`
      CREATE TYPE "dialect_enum" AS ENUM ('STANDARD', 'NORTHERN', 'CENTRAL', 'SOUTHERN')
    `);

    // Add classifier column to vocabularies
    await queryRunner.query(`
      ALTER TABLE "vocabularies" 
      ADD COLUMN "classifier" VARCHAR NULL
    `);

    // Add dialect_variants column (JSONB for flexible storage)
    await queryRunner.query(`
      ALTER TABLE "vocabularies" 
      ADD COLUMN "dialect_variants" JSONB NULL
    `);

    // Add audio_urls column (JSONB for multiple dialect audios)
    await queryRunner.query(`
      ALTER TABLE "vocabularies" 
      ADD COLUMN "audio_urls" JSONB NULL
    `);

    // Add region column (which dialect this word belongs to)
    await queryRunner.query(`
      ALTER TABLE "vocabularies" 
      ADD COLUMN "region" "dialect_enum" NULL
    `);

    // Add preferred_dialect to users
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "preferred_dialect" "dialect_enum" NOT NULL DEFAULT 'STANDARD'
    `);

    // Create index for faster dialect queries
    await queryRunner.query(`
      CREATE INDEX "idx_vocabularies_region" ON "vocabularies" ("region")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_preferred_dialect" ON "users" ("preferred_dialect")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "idx_users_preferred_dialect"`);
    await queryRunner.query(`DROP INDEX "idx_vocabularies_region"`);

    // Drop columns from users
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "preferred_dialect"`);

    // Drop columns from vocabularies
    await queryRunner.query(`ALTER TABLE "vocabularies" DROP COLUMN "region"`);
    await queryRunner.query(`ALTER TABLE "vocabularies" DROP COLUMN "audio_urls"`);
    await queryRunner.query(`ALTER TABLE "vocabularies" DROP COLUMN "dialect_variants"`);
    await queryRunner.query(`ALTER TABLE "vocabularies" DROP COLUMN "classifier"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE "dialect_enum"`);
  }
}
