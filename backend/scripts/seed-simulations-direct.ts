/**
 * Standalone simulations seed — bypasses NestJS bootstrap (avoids Bull/Bun Windows incompat).
 * Connects DataSource directly to Neon then calls the existing `seedSimulations(ds)` function.
 *
 * Usage:
 *   DATABASE_URL='...' bun run scripts/seed-simulations-direct.ts
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import { seedSimulations } from './seed-simulations';

async function main() {
  const url = process.env.DATABASE_URL;
  const useSSL =
    process.env.DATABASE_SSL === 'true' ||
    (url ? /sslmode=(require|verify)/.test(url) : false);

  const ds = new DataSource({
    type: 'postgres',
    ...(url
      ? { url }
      : {
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT || '5432', 10),
          username: process.env.DATABASE_USER || 'postgres',
          password: process.env.DATABASE_PASSWORD || 'postgres',
          database: process.env.DATABASE_NAME || 'linvnix',
        }),
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    entities: [path.resolve(__dirname, '..', 'src') + '/**/*.entity.{ts,js}'],
    synchronize: false,
    logging: false,
  });

  await ds.initialize();
  console.log('DataSource connected. Running seedSimulations...');
  await seedSimulations(ds);
  await ds.destroy();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
