import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDialogueDataColumn20260602120000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'lesson_contents',
      new TableColumn({
        name: 'dialogue_data',
        type: 'jsonb',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('lesson_contents', 'dialogue_data');
  }
}
