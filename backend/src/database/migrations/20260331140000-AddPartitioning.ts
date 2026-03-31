import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPartitioning20260331140000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL partitioning requires manual setup
    // This migration documents the partitioning strategy
    
    // For user_exercise_results: Monthly partitioning
    await queryRunner.query(`
      -- Create partitioned table for user_exercise_results
      CREATE TABLE IF NOT EXISTS user_exercise_results_partitioned (
        LIKE user_exercise_results INCLUDING ALL
      ) PARTITION BY RANGE (attempted_at);
      
      -- Create partitions for current and next 3 months
      CREATE TABLE IF NOT EXISTS user_exercise_results_2026_03 
        PARTITION OF user_exercise_results_partitioned
        FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
        
      CREATE TABLE IF NOT EXISTS user_exercise_results_2026_04 
        PARTITION OF user_exercise_results_partitioned
        FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
        
      CREATE TABLE IF NOT EXISTS user_exercise_results_2026_05 
        PARTITION OF user_exercise_results_partitioned
        FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
        
      CREATE TABLE IF NOT EXISTS user_exercise_results_2026_06 
        PARTITION OF user_exercise_results_partitioned
        FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
    `);

    // For user_progress: Quarterly partitioning
    await queryRunner.query(`
      -- Create partitioned table for user_progress
      CREATE TABLE IF NOT EXISTS user_progress_partitioned (
        LIKE user_progress INCLUDING ALL
      ) PARTITION BY RANGE (last_accessed_at);
      
      -- Create partitions for current and next 2 quarters
      CREATE TABLE IF NOT EXISTS user_progress_2026_q1 
        PARTITION OF user_progress_partitioned
        FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
        
      CREATE TABLE IF NOT EXISTS user_progress_2026_q2 
        PARTITION OF user_progress_partitioned
        FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
        
      CREATE TABLE IF NOT EXISTS user_progress_2026_q3 
        PARTITION OF user_progress_partitioned
        FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
    `);

    // Create archive tables
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_exercise_results_archive (
        LIKE user_exercise_results INCLUDING ALL
      );
      
      CREATE TABLE IF NOT EXISTS user_progress_archive (
        LIKE user_progress INCLUDING ALL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS user_exercise_results_archive CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_progress_archive CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_exercise_results_partitioned CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_progress_partitioned CASCADE`);
  }
}
