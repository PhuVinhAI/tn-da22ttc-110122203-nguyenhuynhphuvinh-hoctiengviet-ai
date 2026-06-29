/**
 * One-off script: migrate seed JSON files for the new exercise types schema.
 *
 *  - FILL_BLANK: move `question` → `options.sentence`; set `question = null`
 *  - TRANSLATION: move `question` → `options.sourceText`; set `question = null`
 *  - MATCHING: set `question = null` (currently empty string)
 *
 * Usage:
 *   bun run backend/scripts/migrate-seed-exercise-types.ts
 */

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SEED_DIR = join(__dirname, '..', '..', '.scratch', 'seed-data');

interface ExerciseSeed {
  question_type: string;
  question?: string | null;
  options?: Record<string, unknown> | null;
  correct_answer?: unknown;
  [key: string]: unknown;
}

interface LessonSeed {
  questions?: QuestionSeed[];
  [key: string]: unknown;
}

function migrateExercise(ex: QuestionSeed): { changed: boolean; ex: QuestionSeed } {
  let changed = false;
  const opts = (ex.options ?? {}) as Record<string, unknown>;

  switch (ex.question_type) {
    case 'fill_blank': {
      // If sentence missing, take it from question
      if (typeof opts.sentence !== 'string' || !opts.sentence) {
        opts.sentence = ex.question ?? '';
        opts.type = 'fill_blank';
        ex.options = opts;
        changed = true;
      }
      if (ex.question != null) {
        ex.question = null;
        changed = true;
      }
      break;
    }

    case 'translation': {
      if (typeof opts.sourceText !== 'string' || !opts.sourceText) {
        opts.sourceText = ex.question ?? '';
        opts.type = 'translation';
        ex.options = opts;
        changed = true;
      }
      if (ex.question != null) {
        ex.question = null;
        changed = true;
      }
      break;
    }

    case 'matching': {
      if (ex.question != null) {
        ex.question = null;
        changed = true;
      }
      break;
    }
  }

  return { changed, ex };
}

function walk(node: unknown, counters: Record<string, number>): unknown {
  if (Array.isArray(node)) {
    return node.map((n) => walk(n, counters));
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj.questions)) {
      obj.questions = (obj.questions as ExerciseSeed[]).map((ex) => {
        const { changed, ex: migrated } = migrateExercise(ex);
        if (changed) {
          counters[migrated.question_type] =
            (counters[migrated.question_type] ?? 0) + 1;
        }
        return migrated;
      });
    }
    for (const [k, v] of Object.entries(obj)) {
      if (k !== 'exercises') {
        obj[k] = walk(v, counters);
      }
    }
    return obj;
  }
  return node;
}

function main() {
  const files = readdirSync(SEED_DIR).filter((f) => f.endsWith('.json'));
  let totalChanged = 0;
  for (const file of files) {
    const path = join(SEED_DIR, file);
    const raw = readFileSync(path, 'utf-8');
    const data: LessonSeed = JSON.parse(raw);
    const counters: Record<string, number> = {};
    walk(data, counters);
    const sum = Object.values(counters).reduce((a, b) => a + b, 0);
    if (sum > 0) {
      writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
      console.log(`✓ ${file}: migrated ${sum} exercises`, counters);
      totalChanged += sum;
    } else {
      console.log(`- ${file}: nothing to migrate`);
    }
  }
  console.log(`\nDone. Total migrated: ${totalChanged}`);
}

main();
