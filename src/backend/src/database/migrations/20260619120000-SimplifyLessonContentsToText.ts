import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Đơn giản hoá lesson_contents — chỉ giữ văn bản (vietnameseText + translation).
 * Bỏ phân loại content_type, payload jsonb, dialogue_data, và hội thoại
 * không còn xuất hiện trong nội dung bài học. Mọi bản ghi dialogue bị xoá
 * cứng vì không thể chuyển sang dạng văn bản một cách ý nghĩa.
 */
export class SimplifyLessonContentsToText20260619120000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Xoá các bản ghi không thể chuyển thành văn bản.
    await queryRunner.query(
      `DELETE FROM "lesson_contents" WHERE "content_type" = 'dialogue'`,
    );

    // 2. Bỏ các cột thừa.
    await queryRunner.query(
      `ALTER TABLE "lesson_contents" DROP COLUMN IF EXISTS "content_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_contents" DROP COLUMN IF EXISTS "payload"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_contents" DROP COLUMN IF EXISTS "dialogue_data"`,
    );

    // 3. Bỏ enum content_type nếu còn (TypeORM tạo dưới tên content_type_enum).
    await queryRunner.query(
      `DROP TYPE IF EXISTS "lesson_contents_content_type_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "lesson_contents_content_type_enum" AS ENUM ('text','audio','image','video','dialogue')`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_contents" ADD COLUMN "content_type" "lesson_contents_content_type_enum" NOT NULL DEFAULT 'text'`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_contents" ADD COLUMN "payload" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_contents" ADD COLUMN "dialogue_data" jsonb`,
    );
  }
}
