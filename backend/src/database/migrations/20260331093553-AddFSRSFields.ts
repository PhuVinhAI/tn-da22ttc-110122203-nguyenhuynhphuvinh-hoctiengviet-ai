import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFSRSFields20260331093553 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add FSRS fields to user_vocabularies table
    await queryRunner.addColumn(
      'user_vocabularies',
      new TableColumn({
        name: 'stability',
        type: 'float',
        default: 0,
        comment: 'FSRS: Memory stability in days',
      }),
    );

    await queryRunner.addColumn(
      'user_vocabularies',
      new TableColumn({
        name: 'difficulty',
        type: 'float',
        default: 0,
        comment: 'FSRS: Item difficulty (1-10)',
      }),
    );

    await queryRunner.addColumn(
      'user_vocabularies',
      new TableColumn({
        name: 'state',
        type: 'int',
        default: 0,
        comment: 'FSRS: Card state (0=New, 1=Learning, 2=Review, 3=Relearning)',
      }),
    );

    await queryRunner.addColumn(
      'user_vocabularies',
      new TableColumn({
        name: 'elapsed_days',
        type: 'int',
        default: 0,
        comment: 'FSRS: Days since last review',
      }),
    );

    await queryRunner.addColumn(
      'user_vocabularies',
      new TableColumn({
        name: 'scheduled_days',
        type: 'int',
        default: 0,
        comment: 'FSRS: Days scheduled for next review',
      }),
    );

    await queryRunner.addColumn(
      'user_vocabularies',
      new TableColumn({
        name: 'reps',
        type: 'int',
        default: 0,
        comment: 'FSRS: Number of repetitions',
      }),
    );

    await queryRunner.addColumn(
      'user_vocabularies',
      new TableColumn({
        name: 'lapses',
        type: 'int',
        default: 0,
        comment: 'FSRS: Number of lapses (forgotten)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove FSRS fields from user_vocabularies table
    await queryRunner.dropColumn('user_vocabularies', 'stability');
    await queryRunner.dropColumn('user_vocabularies', 'difficulty');
    await queryRunner.dropColumn('user_vocabularies', 'state');
    await queryRunner.dropColumn('user_vocabularies', 'elapsed_days');
    await queryRunner.dropColumn('user_vocabularies', 'scheduled_days');
    await queryRunner.dropColumn('user_vocabularies', 'reps');
    await queryRunner.dropColumn('user_vocabularies', 'lapses');
  }
}
