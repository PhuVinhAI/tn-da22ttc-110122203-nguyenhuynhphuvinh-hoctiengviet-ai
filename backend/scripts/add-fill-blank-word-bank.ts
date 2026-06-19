/**
 * One-off script: inject `wordBank` into every fill_blank question in seed JSON.
 *
 * The new mobile UX is click-to-fill (no typing). Each fill_blank needs a
 * `wordBank` containing every correct answer plus a few distractors so the
 * learner taps a chip into each blank.
 *
 * Strategy: for every lesson, build a distractor pool from
 *   - vocabularies.word in the lesson
 *   - other fill_blank answers in the same lesson
 * Then for each fill_blank:
 *   - keep existing wordBank if it already covers every correct answer
 *   - otherwise build new wordBank = correctAnswers + N random distractors
 *     (N = max(2, 4 - blanks)) so the bank is bigger than the blank count.
 *
 * Usage:
 *   bun run backend/scripts/add-fill-blank-word-bank.ts
 */

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SEED_DIR = join(__dirname, '..', '..', '.scratch', 'seed-data');

interface QuestionSeed {
  question_type: string;
  question?: string | null;
  options?: Record<string, unknown> | null;
  correct_answer?: Record<string, unknown> | null;
  [key: string]: unknown;
}

interface VocabSeed {
  word: string;
  [key: string]: unknown;
}

interface LessonSeed {
  vocabularies?: VocabSeed[];
  questions?: QuestionSeed[];
  [key: string]: unknown;
}

function pickRandom<T>(pool: T[], n: number, seed: number): T[] {
  // Deterministic shuffle via LCG so re-runs are stable.
  const arr = [...pool];
  let s = seed || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

function lowerEq(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function processLesson(lesson: LessonSeed, counters: Record<string, number>) {
  const questions = Array.isArray(lesson.questions) ? lesson.questions : [];
  const fillBlanks = questions.filter((q) => q.question_type === 'fill_blank');
  if (fillBlanks.length === 0) return;

  const distractorPool: string[] = [];
  for (const v of lesson.vocabularies ?? []) {
    if (typeof v.word === 'string' && v.word.trim()) {
      distractorPool.push(v.word.trim());
    }
  }
  for (const fb of fillBlanks) {
    const ans = (fb.correct_answer?.answers as unknown[]) ?? [];
    for (const a of ans) {
      if (typeof a === 'string' && a.trim()) distractorPool.push(a.trim());
    }
  }

  let seedNum = 0;
  for (const ch of (lesson as any).title ?? '') {
    seedNum = ((seedNum << 5) - seedNum + ch.charCodeAt(0)) | 0;
  }

  fillBlanks.forEach((fb, idx) => {
    const opts = (fb.options ?? {}) as Record<string, unknown>;
    const correct = ((fb.correct_answer?.answers as unknown[]) ?? [])
      .filter((a): a is string => typeof a === 'string')
      .map((a) => a.trim())
      .filter(Boolean);

    const existing = Array.isArray(opts.wordBank)
      ? (opts.wordBank as unknown[]).filter(
          (w): w is string => typeof w === 'string',
        )
      : [];

    const coversAll = correct.every((a) =>
      existing.some((w) => lowerEq(w, a)),
    );
    if (existing.length > 0 && coversAll) {
      counters.kept = (counters.kept ?? 0) + 1;
      return;
    }

    const blanks =
      typeof opts.blanks === 'number' ? opts.blanks : correct.length || 1;
    const distractorCount = Math.max(2, 4 - blanks);

    const candidates = distractorPool.filter(
      (w) => !correct.some((a) => lowerEq(a, w)),
    );
    const distractors = pickRandom(candidates, distractorCount, seedNum + idx);

    opts.wordBank = [...correct, ...distractors];
    opts.type = 'fill_blank';
    fb.options = opts;
    counters.added = (counters.added ?? 0) + 1;
  });
}

function walk(node: unknown, counters: Record<string, number>): unknown {
  if (Array.isArray(node)) {
    return node.map((n) => walk(n, counters));
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj.questions) && Array.isArray(obj.vocabularies)) {
      processLesson(obj as LessonSeed, counters);
    }
    for (const [k, v] of Object.entries(obj)) {
      obj[k] = walk(v, counters);
    }
    return obj;
  }
  return node;
}

function main() {
  const files = readdirSync(SEED_DIR).filter((f) => f.endsWith('.json'));
  let totalAdded = 0;
  let totalKept = 0;
  for (const file of files) {
    const path = join(SEED_DIR, file);
    const raw = readFileSync(path, 'utf-8').replace(/^﻿/, '');
    const data = JSON.parse(raw);
    const counters: Record<string, number> = {};
    walk(data, counters);
    const added = counters.added ?? 0;
    const kept = counters.kept ?? 0;
    if (added > 0) {
      writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
      console.log(`✓ ${file}: added wordBank to ${added} (kept ${kept})`);
      totalAdded += added;
    } else {
      console.log(`- ${file}: nothing to add (kept ${kept})`);
    }
    totalKept += kept;
  }
  console.log(`\nDone. Added: ${totalAdded}, kept existing: ${totalKept}`);
}

main();
