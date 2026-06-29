import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bỏ bảng user_vocabularies — bảng mồ côi, không entity nào map, không
 * service nào đọc/ghi. Trước đây dự định lưu trạng thái FSRS (stability,
 * difficulty, state, elapsed_days, scheduled_days, reps, lapses) nhưng
 * thuật toán spaced-repetition đã bị bỏ. Per-user vocab giờ dùng
 * personal_vocabularies.
 */
export class DropUserVocabulariesTable20260619140000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_vocabularies" CASCADE`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Không khôi phục — bảng đã mồ côi từ lâu, không có dữ liệu hữu ích.
    // Nếu cần phục hồi schema cũ, chạy lại các migration AddFSRSFields +
    // bất kỳ migration nào tạo user_vocabularies nguyên thủy.
  }
}
