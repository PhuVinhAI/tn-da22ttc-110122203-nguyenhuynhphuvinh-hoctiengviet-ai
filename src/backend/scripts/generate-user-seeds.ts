#!/usr/bin/env bun

/**
 * Generate 10,000 learner seed files (one JSON file per user).
 * Each user simulates realistic app usage from 1 day up to 1 year of tenure.
 *
 * Usage (from backend/):
 *   bun run generate:user-seeds
 *   bun run generate:user-seeds -- --count 100 --output ../../.scratch/seed-data/users-test
 */

import fs from 'fs';
import path from 'path';
import { buildManifestEntry, generateUserSeed } from './user-seeds/generate-user';
import { funnelCounts } from './user-seeds/funnel';

const DEFAULT_COUNT = 10_000;
const DEFAULT_OUTPUT = path.resolve(__dirname, '../../.scratch/seed-data/users');

function parseArgs() {
  const args = process.argv.slice(2);
  let count = DEFAULT_COUNT;
  let outputDir = DEFAULT_OUTPUT;
  let from = 1;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--count' && args[i + 1]) {
      count = parseInt(args[i + 1], 10);
      i += 1;
    } else if (arg === '--from' && args[i + 1]) {
      from = parseInt(args[i + 1], 10);
      i += 1;
    } else if (arg === '--output' && args[i + 1]) {
      outputDir = path.resolve(args[i + 1]);
      i += 1;
    }
  }

  return { count, from, outputDir };
}

async function main() {
  const { count, from, outputDir } = parseArgs();
  fs.mkdirSync(outputDir, { recursive: true });

  const manifest = {
    schemaVersion: 3,
    generatedAt: new Date().toISOString(),
    totalUsers: count,
    range: { from, to: from + count - 1 },
    defaultPassword: 'SeedPass2026! (local accounts only)',
    funnelDistribution: funnelCounts(),
    outputDir,
    users: [] as ReturnType<typeof buildManifestEntry>[],
  };

  console.log(`Generating ${count} user seed files → ${outputDir}\n`);

  for (let i = 0; i < count; i += 1) {
    const index = from + i;
    const seed = generateUserSeed(index);
    const fileName = `${seed.seedId}.json`;
    fs.writeFileSync(path.join(outputDir, fileName), JSON.stringify(seed));

    manifest.users.push(buildManifestEntry(seed));

    if ((i + 1) % 500 === 0 || i + 1 === count) {
      console.log(`  ${i + 1}/${count} files written`);
    }
  }

  const manifestPath = path.resolve(outputDir, '..', 'users-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to ${manifestPath}`);
  console.log('Done.');
}

main().catch((error) => {
  console.error('generate-user-seeds failed:', error);
  process.exit(1);
});
