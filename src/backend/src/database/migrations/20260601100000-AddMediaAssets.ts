import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddMediaAssets20260601100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'media_assets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'kind',
            type: 'enum',
            enum: ['image', 'audio', 'video'],
          },
          { name: 'filename', type: 'varchar', length: '255' },
          { name: 'original_name', type: 'varchar', length: '500' },
          { name: 'url', type: 'varchar', length: '1000', isUnique: true },
          { name: 'mimetype', type: 'varchar', length: '100' },
          { name: 'size', type: 'bigint' },
          { name: 'uploaded_by', type: 'uuid', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'media_assets',
      new TableIndex({
        name: 'IDX_media_assets_url',
        columnNames: ['url'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'media_assets',
      new TableIndex({
        name: 'IDX_media_assets_uploaded_by',
        columnNames: ['uploaded_by'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('media_assets', 'IDX_media_assets_uploaded_by');
    await queryRunner.dropIndex('media_assets', 'IDX_media_assets_url');
    await queryRunner.dropTable('media_assets');
  }
}
