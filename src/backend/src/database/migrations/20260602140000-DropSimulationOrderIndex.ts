import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropSimulationOrderIndex20260602140000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // scenario_categories — drop the global unique index + non-negative check
    // before dropping the column they cover.
    await queryRunner.query(
      `ALTER TABLE "scenario_categories" DROP CONSTRAINT IF EXISTS "CHK_scenario_categories_order_index_non_negative"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_scenario_categories_active_order_index"`,
    );
    await queryRunner.dropColumn('scenario_categories', 'order_index');

    // scenario_characters — the composite (scenario_id, order_index) unique
    // index is auto-named by TypeORM; dropColumn drops dependent indexes.
    await queryRunner.dropColumn('scenario_characters', 'order_index');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'scenario_categories',
      new TableColumn({
        name: 'order_index',
        type: 'int',
        default: 0,
      }),
    );
    await queryRunner.query(
      `ALTER TABLE "scenario_categories" ADD CONSTRAINT "CHK_scenario_categories_order_index_non_negative" CHECK ("order_index" >= 0)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_scenario_categories_active_order_index" ON "scenario_categories" ("order_index") WHERE deleted_at IS NULL`,
    );

    await queryRunner.addColumn(
      'scenario_characters',
      new TableColumn({
        name: 'order_index',
        type: 'int',
        default: 0,
      }),
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_scenario_characters_scenario_order" ON "scenario_characters" ("scenario_id", "order_index") WHERE deleted_at IS NULL`,
    );
  }
}
