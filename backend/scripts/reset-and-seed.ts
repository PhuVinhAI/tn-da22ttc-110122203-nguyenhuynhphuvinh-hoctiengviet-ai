/**
 * Full reset + seed pipeline (DESTRUCTIVE):
 *   1. DROP SCHEMA public CASCADE; CREATE SCHEMA public + sync via TypeORM
 *   2. FLUSHDB on Redis
 *   3. Create admin user (admin@linvnix.test)
 *   4. bun run scripts/seed-lessons.ts
 *   5. bun run scripts/seed-simulations-direct.ts
 *
 * Usage (from backend/):
 *   bun run db:reset-seed
 */

import 'reflect-metadata';
import path from 'path';
import { spawnSync } from 'child_process';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';

const ADMIN_EMAIL = 'admin@linvnix.test';
const ADMIN_PASSWORD = 'Str0ng!Boss2026';
const ADMIN_NAME = 'Admin User';

const BACKEND_DIR = path.resolve(__dirname, '..');

function buildDataSource(synchronize: boolean): DataSource {
  const url = process.env.DATABASE_URL;
  const useSSL =
    process.env.DATABASE_SSL === 'true' ||
    (url ? /sslmode=(require|verify)/.test(url) : false);

  return new DataSource({
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
    entities: [path.resolve(BACKEND_DIR, 'src') + '/**/*.entity.{ts,js}'],
    synchronize,
    logging: false,
  });
}

async function resetDatabase() {
  console.log('[1/5] Dropping all objects in public schema...');
  const ds = buildDataSource(false);
  await ds.initialize();

  const tables: Array<{ table_name: string }> = await ds.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'",
  );
  for (const { table_name } of tables) {
    await ds.query(`DROP TABLE IF EXISTS "${table_name}" CASCADE`);
  }

  const types: Array<{ typname: string }> = await ds.query(
    "SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e'",
  );
  for (const { typname } of types) {
    await ds.query(`DROP TYPE IF EXISTS "${typname}"`);
  }
  await ds.destroy();

  console.log('[1/5] Syncing schema from entities...');
  const syncDs = buildDataSource(true);
  await syncDs.initialize();
  await syncDs.destroy();
  console.log('[1/5] Database schema reset.\n');
}

async function flushRedis() {
  console.log('[2/5] Flushing Redis (FLUSHDB)...');
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
  try {
    await redis.connect();
    await redis.flushdb();
    console.log('[2/5] Redis flushed.\n');
  } catch (e) {
    console.warn('[2/5] Redis flush skipped:', (e as Error).message, '\n');
  } finally {
    redis.disconnect();
  }
}

async function createAdmin() {
  console.log('[3/5] Creating admin user...');
  const ds = buildDataSource(false);
  await ds.initialize();
  try {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const existing = await ds.query(
      'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1',
      [ADMIN_EMAIL],
    );
    if (existing.length > 0) {
      await ds.query(
        `UPDATE users
           SET password = $1, role = $2, email_verified = $3,
               email_verified_at = NOW(), updated_at = NOW()
         WHERE id = $4`,
        [hashed, 'ADMIN', true, existing[0].id],
      );
    } else {
      await ds.query(
        `INSERT INTO users (id, email, password, full_name, native_language, role, email_verified, email_verified_at, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())`,
        [ADMIN_EMAIL, hashed, ADMIN_NAME, 'Vietnamese', 'ADMIN', true],
      );
    }
    console.log(`[3/5] Admin ready: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}\n`);
  } finally {
    await ds.destroy();
  }
}

function runScript(scriptName: string, step: string) {
  console.log(`[${step}] Running scripts/${scriptName}...`);
  const result = spawnSync('bun', ['run', `scripts/${scriptName}`], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(
      `scripts/${scriptName} failed with exit code ${result.status}`,
    );
  }
  console.log();
}

async function main() {
  await resetDatabase();
  await flushRedis();
  await createAdmin();
  runScript('seed-lessons.ts', '4/5');
  runScript('seed-simulations-direct.ts', '5/5');
  console.log('All done.');
}

main().catch((err) => {
  console.error('reset-and-seed failed:', err);
  process.exit(1);
});
