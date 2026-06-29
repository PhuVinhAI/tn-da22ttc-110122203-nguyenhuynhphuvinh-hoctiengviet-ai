import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration để fix vấn đề Soft Delete + Unique Constraint
 *
 * Vấn đề: Khi user bị soft-delete, email vẫn bị unique constraint
 * Giải pháp: Dùng Partial Index - chỉ unique khi deleted_at IS NULL
 */
export class AddPartialUniqueIndexes1234567890124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing unique constraints
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_google_id"`,
    );

    // Drop existing unique indexes nếu có
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_google_id"`);

    // Tạo Partial Unique Index cho email (chỉ unique khi chưa bị xóa)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_email_not_deleted" 
       ON "users" ("email") 
       WHERE "deleted_at" IS NULL`,
    );

    // Tạo Partial Unique Index cho google_id (chỉ unique khi chưa bị xóa)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_google_id_not_deleted" 
       ON "users" ("google_id") 
       WHERE "deleted_at" IS NULL AND "google_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop partial indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_users_email_not_deleted"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_users_google_id_not_deleted"`,
    );

    // Restore original unique constraints
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_users_email" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_users_google_id" UNIQUE ("google_id")`,
    );
  }
}
