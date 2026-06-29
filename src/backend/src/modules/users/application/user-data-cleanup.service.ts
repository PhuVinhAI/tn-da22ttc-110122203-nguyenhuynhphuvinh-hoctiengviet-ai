import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import {
  Transactional,
  TransactionalHost,
} from '../../../common/decorators/transactional.decorator';

@Injectable()
export class UserDataCleanupService implements TransactionalHost {
  dataSource: DataSource;
  queryRunner?: QueryRunner;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  @Transactional()
  async clearAllUserData(userId: string): Promise<void> {
    const qr = this.queryRunner!;
    await this.deleteLearningData(qr, userId);
    await qr.query(
      `UPDATE users SET onboarding_completed = false WHERE id = $1`,
      [userId],
    );
  }

  @Transactional()
  async deleteAccount(userId: string): Promise<void> {
    const qr = this.queryRunner!;
    await this.deleteLearningData(qr, userId);
    await qr.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
    await qr.query(`DELETE FROM auth_tokens WHERE user_id = $1`, [userId]);
    await qr.query(
      `UPDATE users SET
         email = CONCAT('deleted_', id, '@deleted.local'),
         google_id = NULL,
         onboarding_completed = false,
         email_verified = false,
         email_verified_at = NULL,
         deleted_at = NOW()
       WHERE id = $1`,
      [userId],
    );
  }

  private async deleteLearningData(
    qr: QueryRunner,
    userId: string,
  ): Promise<void> {
    await qr.query(
      `DELETE FROM conversation_messages
       WHERE conversation_id IN (
         SELECT id FROM conversations WHERE user_id = $1
       )`,
      [userId],
    );
    await qr.query(`DELETE FROM conversations WHERE user_id = $1`, [userId]);
    await qr.query(
      `DELETE FROM simulation_messages
       WHERE session_id IN (
         SELECT id FROM simulation_sessions WHERE user_id = $1
       )`,
      [userId],
    );
    await qr.query(`DELETE FROM simulation_sessions WHERE user_id = $1`, [
      userId,
    ]);
    await qr.query(`DELETE FROM bookmarks WHERE user_id = $1`, [userId]);
    await qr.query(`DELETE FROM personal_vocabularies WHERE user_id = $1`, [
      userId,
    ]);
    await qr.query(`DELETE FROM question_attempts WHERE user_id = $1`, [
      userId,
    ]);
    await qr.query(`DELETE FROM user_question_results WHERE user_id = $1`, [
      userId,
    ]);
    await qr.query(
      `DELETE FROM exercises
       WHERE exercise_id IN (
           SELECT id FROM exercises
           WHERE owner_user_id = $1 AND is_custom = true
         )`,
      [userId],
    );
    await qr.query(
      `DELETE FROM exercises
       WHERE owner_user_id = $1 AND is_custom = true`,
      [userId],
    );
    await qr.query(`DELETE FROM learning_progress WHERE user_id = $1`, [
      userId,
    ]);
    await qr.query(`DELETE FROM daily_goal_progress WHERE user_id = $1`, [
      userId,
    ]);
    await qr.query(`DELETE FROM daily_goals WHERE user_id = $1`, [userId]);
    await qr.query(`DELETE FROM daily_streaks WHERE user_id = $1`, [userId]);
  }
}
