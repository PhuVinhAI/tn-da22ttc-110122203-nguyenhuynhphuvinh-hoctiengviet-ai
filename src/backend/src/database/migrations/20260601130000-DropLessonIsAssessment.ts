import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropLessonIsAssessment20260601130000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('lessons', 'is_assessment');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'lessons',
      new TableColumn({
        name: 'is_assessment',
        type: 'boolean',
        default: false,
      }),
    );
  }
}
