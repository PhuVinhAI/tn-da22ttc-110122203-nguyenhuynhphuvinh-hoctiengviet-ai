import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSimulationMessageContentEn20260528120000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'simulation_messages',
      new TableColumn({
        name: 'content_en',
        type: 'text',
        isNullable: true,
        comment: 'English translation of NPC message content',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('simulation_messages', 'content_en');
  }
}
