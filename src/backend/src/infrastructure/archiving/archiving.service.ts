import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class ArchivingService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private loggingService: LoggingService,
  ) {}

  // Run monthly at 2 AM on the 1st day
  @Cron('0 2 1 * *')
  async archiveOldQuestionResults() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    try {
      await this.dataSource.query(
        `CREATE TABLE IF NOT EXISTS question_attempts_archive
         (LIKE question_attempts INCLUDING ALL)`,
      );

      const result = await this.dataSource.query(
        `
        INSERT INTO question_attempts_archive
        SELECT * FROM question_attempts
        WHERE attempted_at < $1
        ON CONFLICT DO NOTHING
        `,
        [sixMonthsAgo],
      );

      this.loggingService.log(
        `Archived ${result.length} exercise results older than ${sixMonthsAgo.toISOString()}`,
        'ArchivingService',
      );

      // Delete archived records
      await this.dataSource.query(
        `DELETE FROM question_attempts WHERE attempted_at < $1`,
        [sixMonthsAgo],
      );

      this.loggingService.log(
        `Deleted archived exercise results`,
        'ArchivingService',
      );
    } catch (error) {
      this.loggingService.error(
        'Failed to archive exercise results',
        error.stack,
        'ArchivingService',
      );
    }
  }

  // Run quarterly at 3 AM on the 1st day
  @Cron('0 3 1 */3 *')
  async archiveOldProgress() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    try {
      await this.dataSource.query(
        `CREATE TABLE IF NOT EXISTS learning_progress_archive
         (LIKE learning_progress INCLUDING ALL)`,
      );

      const result = await this.dataSource.query(
        `
        INSERT INTO learning_progress_archive
        SELECT * FROM learning_progress
        WHERE last_accessed_at < $1
        ON CONFLICT DO NOTHING
        `,
        [oneYearAgo],
      );

      this.loggingService.log(
        `Archived ${result.length} progress records older than ${oneYearAgo.toISOString()}`,
        'ArchivingService',
      );

      // Delete archived records
      await this.dataSource.query(
        `DELETE FROM learning_progress WHERE last_accessed_at < $1`,
        [oneYearAgo],
      );

      this.loggingService.log(
        `Deleted archived progress records`,
        'ArchivingService',
      );
    } catch (error) {
      this.loggingService.error(
        'Failed to archive progress',
        error.stack,
        'ArchivingService',
      );
    }
  }

  // Manual trigger for testing
  async manualArchive() {
    await this.archiveOldQuestionResults();
    await this.archiveOldProgress();
  }
}
