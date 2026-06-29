import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGoogleOAuth1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Thêm google_id column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'google_id',
        type: 'varchar',
        isNullable: true,
        isUnique: true,
      }),
    );

    // Thêm provider column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'provider',
        type: 'varchar',
        default: "'local'",
      }),
    );

    // Làm password nullable cho OAuth users
    await queryRunner.changeColumn(
      'users',
      'password',
      new TableColumn({
        name: 'password',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'google_id');
    await queryRunner.dropColumn('users', 'provider');

    // Revert password to not nullable
    await queryRunner.changeColumn(
      'users',
      'password',
      new TableColumn({
        name: 'password',
        type: 'varchar',
        isNullable: false,
      }),
    );
  }
}
