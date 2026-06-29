import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropModuleTopic20260601120000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('modules', 'topic');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'modules',
      new TableColumn({
        name: 'topic',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }
}
