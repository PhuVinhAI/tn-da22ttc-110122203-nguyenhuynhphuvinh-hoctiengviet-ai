import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tái cấu trúc lesson_contents — gom các cột phẳng audio_url/image_url/video_url
 * thành cột payload jsonb theo schema riêng từng loại. Mỗi loại nội dung
 * (text/image/audio/video) có UI render riêng trên mobile nên schema cũng tách
 * riêng để admin soạn được đầy đủ metadata.
 *
 * Hội thoại (DIALOGUE) vẫn dùng cột dialogue_data, không đổi.
 */
export class RestructureLessonContents20260610120000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Thêm cột payload jsonb.
    await queryRunner.query(
      `ALTER TABLE "lesson_contents" ADD COLUMN IF NOT EXISTS "payload" jsonb`,
    );

    // 2. Backfill payload từ dữ liệu cũ cho từng loại.
    // TEXT: gom vietnameseText + translation thành { body, translation }.
    await queryRunner.query(`
      UPDATE "lesson_contents"
      SET "payload" = jsonb_strip_nulls(jsonb_build_object(
        'body', COALESCE("vietnamese_text", ''),
        'translation', "translation"
      ))
      WHERE "content_type" = 'text' AND "payload" IS NULL
    `);

    // IMAGE: { url, caption, captionEn, aspectRatio: 'auto' }.
    await queryRunner.query(`
      UPDATE "lesson_contents"
      SET "payload" = jsonb_strip_nulls(jsonb_build_object(
        'url', COALESCE("image_url", ''),
        'caption', COALESCE("vietnamese_text", ''),
        'captionEn', "translation",
        'aspectRatio', 'auto'
      ))
      WHERE "content_type" = 'image' AND "payload" IS NULL
    `);

    // AUDIO: { url, title, transcript, translation }.
    await queryRunner.query(`
      UPDATE "lesson_contents"
      SET "payload" = jsonb_strip_nulls(jsonb_build_object(
        'url', COALESCE("audio_url", ''),
        'title', '',
        'transcript', COALESCE("vietnamese_text", ''),
        'translation', "translation"
      ))
      WHERE "content_type" = 'audio' AND "payload" IS NULL
    `);

    // VIDEO: { url, title, aspectRatio, provider, transcript, translation }.
    await queryRunner.query(`
      UPDATE "lesson_contents"
      SET "payload" = jsonb_strip_nulls(jsonb_build_object(
        'url', COALESCE("video_url", ''),
        'title', '',
        'aspectRatio', '16:9',
        'provider', 'self_hosted',
        'transcript', COALESCE("vietnamese_text", ''),
        'translation', "translation"
      ))
      WHERE "content_type" = 'video' AND "payload" IS NULL
    `);

    // 3. Bỏ các cột URL phẳng cũ — không còn nguồn truth.
    await queryRunner.query(
      `ALTER TABLE "lesson_contents" DROP COLUMN IF EXISTS "audio_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_contents" DROP COLUMN IF EXISTS "image_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_contents" DROP COLUMN IF EXISTS "video_url"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Khôi phục các cột URL phẳng từ payload.
    await queryRunner.query(
      `ALTER TABLE "lesson_contents" ADD COLUMN IF NOT EXISTS "audio_url" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_contents" ADD COLUMN IF NOT EXISTS "image_url" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_contents" ADD COLUMN IF NOT EXISTS "video_url" varchar`,
    );

    await queryRunner.query(`
      UPDATE "lesson_contents"
      SET "audio_url" = "payload" ->> 'url'
      WHERE "content_type" = 'audio'
    `);
    await queryRunner.query(`
      UPDATE "lesson_contents"
      SET "image_url" = "payload" ->> 'url'
      WHERE "content_type" = 'image'
    `);
    await queryRunner.query(`
      UPDATE "lesson_contents"
      SET "video_url" = "payload" ->> 'url'
      WHERE "content_type" = 'video'
    `);

    await queryRunner.query(
      `ALTER TABLE "lesson_contents" DROP COLUMN IF EXISTS "payload"`,
    );
  }
}
