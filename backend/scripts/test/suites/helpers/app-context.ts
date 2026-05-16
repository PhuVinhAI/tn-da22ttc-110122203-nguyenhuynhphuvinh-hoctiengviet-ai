/**
 * Shared bootstrap helper for bun integration tests under
 * `scripts/test/suites/`.
 *
 * Each test suite imports `bootstrapAppContext` to bring up a full
 * application context (no HTTP listener — tests exercise services and tools
 * directly against the real Postgres + Redis stack started by `bun run
 * db:up`). The returned helper exposes:
 *
 * - `app`     — the live `INestApplicationContext` for `get<T>(Token)` lookups
 * - `dataSource` — the typeorm `DataSource` so suites can run cleanup queries
 * - `close()` — gracefully closes the context (call from a `finally` block)
 *
 * `ConfigModule.forRoot({ isGlobal: true })` inside `AppModule` already
 * loads `backend/.env` from `cwd`, so we don\'t need a separate env loader
 * here — just `bun run` the suite from the `backend/` directory.
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../../src/app.module';

export interface AppContext {
  app: INestApplicationContext;
  dataSource: DataSource;
  close: () => Promise<void>;
}

export async function bootstrapAppContext(): Promise<AppContext> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const dataSource = app.get(DataSource);

  return {
    app,
    dataSource,
    close: async () => {
      await app.close();
    },
  };
}
