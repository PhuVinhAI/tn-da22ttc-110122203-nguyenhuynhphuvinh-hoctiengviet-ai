import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSimulationMessageContentEn20260528120000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'simulation_messages',
      new TableColumn({
        name: 'translation',
        type: 'text',
        isNullable: true,
        comment:
          'Translation of NPC message content in learner native language',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('simulation_messages', 'translation');
  }
}
