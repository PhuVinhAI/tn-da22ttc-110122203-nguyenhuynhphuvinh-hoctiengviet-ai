#!/usr/bin/env bun
/**
 * Generate TTS audio for A1 module 1 lesson 1 vocabulary (lesson-a1-001-001)
 * and ensure the companion listening/speaking exercises exist in seed JSON.
 *
 * Uses Google Translate TTS by default (fast, free, keeps Vietnamese diacritics).
 * Pass --edge for slower Microsoft Edge neural voices.
 *
 * Usage (from backend/):
 *   bun run scripts/generate-a1-lesson1-audio.ts              # TTS + update seeds
 *   bun run scripts/generate-a1-lesson1-audio.ts --dry-run    # preview only
 *   bun run scripts/generate-a1-lesson1-audio.ts --seed-only  # patch seeds, no TTS
 *   bun run scripts/generate-a1-lesson1-audio.ts --edge       # slow Edge TTS
 */

import * as fs from 'fs';
import * as path from 'path';
import { synthesizeVietnameseEdgeTts } from './lib/edge-tts-vi';
import {
  runPool,
  synthesizeGoogleTtsVi,
} from './lib/google-tts-vi';

const ROOT = path.resolve(__dirname, '../..');
const SEED_DIR = path.join(ROOT, '.scratch/seed-data');
const SEED_FILES = ['seed-a1.json', 'seed-all.json'];
const UPLOAD_DIR = path.join(__dirname, '../uploads/audio/seed/a1/lesson-001');
const AUDIO_URL_PREFIX = '/uploads/audio/seed/a1/lesson-001';

const VOCAB_LESSON_UUID = 'lesson-a1-001-001';
const LISTENING_LESSON_UUID = 'lesson-a1-001-001-listen';
const MODULE_UUID = 'module-a1-001';

const VOICE_FEMALE =
  process.env.EDGE_TTS_VOICE_FEMALE || 'vi-VN-HoaiMyNeural';
const VOICE_MALE =
  process.env.EDGE_TTS_VOICE_MALE || 'vi-VN-NamMinhNeural';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const seedOnly = args.has('--seed-only');
const useEdgeTts = args.has('--edge');
const TTS_CONCURRENCY = 6;

interface SeedFile {
  courses: Array<{
    modules: Array<{
      __uuid?: string;
      lessons: Array<Record<string, unknown>>;
    }>;
  }>;
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function findModule(data: SeedFile) {
  for (const course of data.courses) {
    for (const mod of course.modules) {
      if (mod.__uuid === MODULE_UUID) return mod;
    }
  }
  return null;
}

function buildListeningLesson(): Record<string, unknown> {
  return {
    __uuid: LISTENING_LESSON_UUID,
    description:
      'Luyện nghe hiểu qua hội thoại chào hỏi và giới thiệu — ôn lại từ vựng bài "Từ vựng chào hỏi cơ bản".',
    estimated_duration: 15,
    questions: [
      {
        correct_answer: {
          transcript: 'bạn',
          type: 'listening',
        },
        difficulty_level: 1,
        question_type: 'listening',
        explanation: "Lan nói: 'Chào bạn! Tôi là Lan.'",
        options: {
          audioUrl: `${AUDIO_URL_PREFIX}/greeting-dialogue.mp3`,
          keywords: ['chào', 'bạn', 'Lan', 'Nam'],
          transcriptType: 'keywords',
          type: 'listening',
        },
        order_index: 1,
        question:
          'Nghe hội thoại Nam và Lan. Điền từ còn thiếu: Lan: Chào ___! Tôi là Lan.',
        question_audio_url: null,
      },
      {
        correct_answer: {
          selectedChoice: 'Rất vui được gặp bạn',
          type: 'multiple_choice',
        },
        difficulty_level: 1,
        question_type: 'multiple_choice',
        explanation: "Lan nói: 'Rất vui được gặp bạn.'",
        options: {
          choices: [
            'Tạm biệt',
            'Xin lỗi',
            'Rất vui được gặp bạn',
            'Không, cảm ơn',
          ],
          type: 'multiple_choice',
        },
        order_index: 2,
        question: 'Theo hội thoại, Lan nói gì sau khi giới thiệu tên?',
        question_audio_url: null,
      },
      {
        correct_answer: {
          transcript: 'Cảm ơn',
          type: 'listening',
        },
        difficulty_level: 1,
        question_type: 'listening',
        explanation: "Nam đáp: 'Cảm ơn! Tôi cũng rất vui.'",
        options: {
          audioUrl: `${AUDIO_URL_PREFIX}/greeting-dialogue.mp3`,
          keywords: ['cảm', 'ơn', 'Nam'],
          transcriptType: 'keywords',
          type: 'listening',
        },
        order_index: 3,
        question:
          'Nghe lại đoạn cuối. Nam nói gì? Viết cụm từ Nam dùng để cảm ơn.',
        question_audio_url: null,
      },
    ],
    grammar_rules: [],
    lesson_contents: [
      {
        audio_url: null,
        content_type: 'text',
        image_url: null,
        notes: null,
        order_index: 1,
        phonetic: null,
        translation:
          'In this lesson you will listen to a short greeting dialogue between Nam and Lan. Focus on hello phrases, introductions, and polite responses from lesson 1.',
        video_url: null,
        vietnamese_text:
          'Trong bài này, bạn sẽ nghe một hội thoại chào hỏi ngắn giữa Nam và Lan. Hãy chú ý các cụm chào hỏi, giới thiệu và đáp lịch sự từ bài từ vựng trước.',
      },
      {
        audio_url: `${AUDIO_URL_PREFIX}/greeting-dialogue.mp3`,
        content_type: 'dialogue',
        image_url: null,
        notes: null,
        order_index: 2,
        phonetic: null,
        translation:
          'Nam: Hello! I am Nam.\nLan: Hello! I am Lan. Very nice to meet you.\nNam: Thank you! Me too.',
        video_url: null,
        vietnamese_text:
          'Nam: Xin chào! Tôi là Nam.\nLan: Chào bạn! Tôi là Lan. Rất vui được gặp bạn.\nNam: Cảm ơn! Tôi cũng rất vui.',
      },
    ],
    lesson_type: 'listening',
    order_index: 2,
    title: 'Luyện nghe: Chào hỏi cơ bản',
    vocabularies: [
      {
        audio_url: `${AUDIO_URL_PREFIX}/xin-chao.mp3`,
        audio_urls: null,
        classifier: null,
        dialect_variants: {
          CENTRAL: 'xin chào',
          NORTHERN: 'xin chào',
          SOUTHERN: 'xin chào',
          STANDARD: 'xin chào',
        },
        difficulty_level: 1,
        example_sentence: 'Xin chào, tôi là Nam.',
        example_translation: 'Hello, I am Nam.',
        image_url: null,
        part_of_speech: 'phrase',
        phonetic: 'sin chow',
        region: 'STANDARD',
        translation: 'hello',
        word: 'xin chào',
      },
      {
        audio_url: `${AUDIO_URL_PREFIX}/cam-on.mp3`,
        audio_urls: null,
        classifier: null,
        dialect_variants: {
          CENTRAL: 'cảm ơn',
          NORTHERN: 'cảm ơn',
          SOUTHERN: 'cảm ơn',
          STANDARD: 'cảm ơn',
        },
        difficulty_level: 1,
        example_sentence: 'Cảm ơn rất nhiều!',
        example_translation: 'Thank you very much!',
        image_url: null,
        part_of_speech: 'phrase',
        phonetic: 'gam uhn',
        region: 'STANDARD',
        translation: 'thank you',
        word: 'cảm ơn',
      },
      {
        audio_url: `${AUDIO_URL_PREFIX}/rat-vui.mp3`,
        audio_urls: null,
        classifier: null,
        dialect_variants: {
          CENTRAL: 'rất vui',
          NORTHERN: 'rất vui',
          SOUTHERN: 'rất vui',
          STANDARD: 'rất vui',
        },
        difficulty_level: 1,
        example_sentence: 'Rất vui được gặp bạn!',
        example_translation: 'Very nice to meet you!',
        image_url: null,
        part_of_speech: 'phrase',
        phonetic: 'ret vooy',
        region: 'STANDARD',
        translation: 'very happy / pleased',
        word: 'rất vui',
      },
    ],
  };
}

function ensureListeningLesson(mod: {
  lessons: Array<Record<string, unknown>>;
}): boolean {
  const hasListening = mod.lessons.some(
    (l) => l.__uuid === LISTENING_LESSON_UUID,
  );
  if (hasListening) return false;

  const listening = buildListeningLesson();
  const insertAt = mod.lessons.findIndex(
    (l) => l.__uuid === 'lesson-a1-001-002',
  );
  const index = insertAt >= 0 ? insertAt : 1;
  mod.lessons.splice(index, 0, listening);

  for (const lesson of mod.lessons) {
    const order = lesson.order_index as number;
    if (lesson.__uuid === VOCAB_LESSON_UUID) {
      lesson.order_index = 1;
    } else if (lesson.__uuid === LISTENING_LESSON_UUID) {
      lesson.order_index = 2;
    } else if (typeof order === 'number' && order >= 2) {
      lesson.order_index = order + 1;
    }
  }
  return true;
}

function buildSpeakingExercise(
  generated: Map<string, string>,
): Record<string, unknown> {
  const promptAudioUrl =
    generated.get('xin-chao') ?? `${AUDIO_URL_PREFIX}/xin-chao.mp3`;

  return {
    correct_answer: {
      transcript: 'xin chào',
      type: 'speaking',
    },
    difficulty_level: 1,
    question_type: 'speaking',
    explanation: 'Cụm từ cần nói là "xin chào".',
    options: {
      promptText: 'xin chào',
      promptAudioUrl,
      transcriptType: 'exact',
      keywords: ['xin', 'chào'],
      type: 'speaking',
    },
    order_index: 6,
    question: 'Bấm loa để nghe mẫu, sau đó nói lại: xin chào',
    question_audio_url: promptAudioUrl,
  };
}

function ensureSpeakingExercise(
  lesson: Record<string, unknown>,
  generated: Map<string, string>,
): boolean {
  const exercises = lesson.exercises as Array<Record<string, unknown>>;
  if (!Array.isArray(exercises)) return false;

  const hasSpeaking = exercises.some(
    (exercise) => exercise.question_type === 'speaking',
  );
  if (hasSpeaking) return false;

  exercises.push(buildSpeakingExercise(generated));
  exercises.sort(
    (a, b) =>
      ((a.order_index as number | undefined) ?? 0) -
      ((b.order_index as number | undefined) ?? 0),
  );
  return true;
}

function patchVocabLessonAudio(
  lesson: Record<string, unknown>,
  generated: Map<string, string>,
): void {
  const vocabularies = lesson.vocabularies as Array<Record<string, unknown>>;
  if (!Array.isArray(vocabularies)) return;

  for (const vocab of vocabularies) {
    const word = vocab.word as string;
    const slug = slugify(word);
    const url = generated.get(slug);
    if (url) {
      vocab.audio_url = url;
    }

    const dialects = vocab.dialect_variants as
      | Record<string, string>
      | undefined;
    if (dialects && word === 'vâng') {
      vocab.audio_urls = {
        NORTHERN: `${AUDIO_URL_PREFIX}/vang.mp3`,
        SOUTHERN: `${AUDIO_URL_PREFIX}/da.mp3`,
        CENTRAL: `${AUDIO_URL_PREFIX}/da.mp3`,
        STANDARD: `${AUDIO_URL_PREFIX}/vang.mp3`,
      };
    }
  }

  const contents = lesson.lesson_contents as Array<Record<string, unknown>>;
  if (Array.isArray(contents)) {
    for (const content of contents) {
      if (content.content_type === 'dialogue') {
        content.audio_url = `${AUDIO_URL_PREFIX}/greeting-dialogue.mp3`;
      }
    }
  }
}

/** Prefer full example sentence so prosody and tones sound natural. */
function ttsTextForVocab(vocab: Record<string, unknown>): string {
  const example = vocab.example_sentence as string | undefined;
  const word = vocab.word as string;
  return (example?.trim() || word).trim();
}

const DIALOGUE_TEXT =
  'Nam: Xin chào! Tôi là Nam. Lan: Chào bạn! Tôi là Lan. Rất vui được gặp bạn. Nam: Cảm ơn! Tôi cũng rất vui.';

async function synthesizeSpeech(text: string, voice: string): Promise<Buffer> {
  if (useEdgeTts) {
    return synthesizeVietnameseEdgeTts(text, voice);
  }
  return synthesizeGoogleTtsVi(text);
}

async function synthesizeDialogue(): Promise<Buffer> {
  if (useEdgeTts) {
    const lines = [
      { voice: VOICE_MALE, text: 'Xin chào! Tôi là Nam.' },
      {
        voice: VOICE_FEMALE,
        text: 'Chào bạn! Tôi là Lan. Rất vui được gặp bạn.',
      },
      { voice: VOICE_MALE, text: 'Cảm ơn! Tôi cũng rất vui.' },
    ];
    const parts: Buffer[] = [];
    for (const line of lines) {
      parts.push(await synthesizeSpeech(line.text, line.voice));
      await sleep(200);
    }
    return Buffer.concat(parts);
  }
  return synthesizeGoogleTtsVi(DIALOGUE_TEXT);
}

async function generateAudioFiles(
  vocabLesson: Record<string, unknown>,
): Promise<Map<string, string>> {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });

  const generated = new Map<string, string>();
  const vocabularies = vocabLesson.vocabularies as Array<Record<string, unknown>>;

  const jobs: Array<{ slug: string; text: string; voice: string; filename: string }> =
    [];

  for (const vocab of vocabularies) {
    const word = vocab.word as string;
    const slug = slugify(word);
    jobs.push({
      slug,
      text: ttsTextForVocab(vocab),
      voice: VOICE_FEMALE,
      filename: `${slug}.mp3`,
    });
  }

  if (!vocabularies.some((v) => (v.word as string) === 'dạ')) {
    jobs.push({
      slug: 'da',
      text: 'Dạ, em nghe rồi ạ.',
      voice: VOICE_FEMALE,
      filename: 'da.mp3',
    });
  }

  const provider = useEdgeTts ? 'Edge (neural, sequential)' : 'Google (fast, parallel)';
  console.log(`  TTS provider: ${provider}\n`);

  if (dryRun) {
    for (const job of jobs) {
      generated.set(job.slug, `${AUDIO_URL_PREFIX}/${job.filename}`);
    }
  } else if (useEdgeTts) {
    for (const job of jobs) {
      const outPath = path.join(UPLOAD_DIR, job.filename);
      const url = `${AUDIO_URL_PREFIX}/${job.filename}`;
      console.log(`  TTS → ${job.filename}`);
      const mp3 = await synthesizeSpeech(job.text, job.voice);
      await fs.promises.writeFile(outPath, mp3);
      generated.set(job.slug, url);
    }
  } else {
    const started = Date.now();
    await runPool(jobs, TTS_CONCURRENCY, async (job) => {
      const outPath = path.join(UPLOAD_DIR, job.filename);
      const url = `${AUDIO_URL_PREFIX}/${job.filename}`;
      const mp3 = await synthesizeGoogleTtsVi(job.text);
      await fs.promises.writeFile(outPath, mp3);
      generated.set(job.slug, url);
      console.log(`  ✓ ${job.filename}`);
    });
    console.log(`  ${jobs.length} files in ${((Date.now() - started) / 1000).toFixed(1)}s\n`);
  }

  const dialoguePath = path.join(UPLOAD_DIR, 'greeting-dialogue.mp3');
  if (!dryRun) {
    console.log('  TTS → greeting-dialogue.mp3');
    const dialogueMp3 = await synthesizeDialogue();
    await fs.promises.writeFile(dialoguePath, dialogueMp3);
  }
  generated.set(
    'greeting-dialogue',
    `${AUDIO_URL_PREFIX}/greeting-dialogue.mp3`,
  );

  return generated;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function processSeedFile(fileName: string, generated: Map<string, string>): void {
  const filePath = path.join(SEED_DIR, fileName);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as SeedFile;
  const mod = findModule(data);
  if (!mod) {
    console.warn(`  Skip ${fileName}: module ${MODULE_UUID} not found`);
    return;
  }

  const inserted = ensureListeningLesson(mod);
  if (inserted) {
    console.log(`  ${fileName}: inserted listening lesson`);
  }

  const vocabLesson = mod.lessons.find((l) => l.__uuid === VOCAB_LESSON_UUID);

  if (vocabLesson && generated.size > 0) {
    patchVocabLessonAudio(vocabLesson, generated);
  }

  if (vocabLesson) {
    const insertedSpeaking = ensureSpeakingExercise(vocabLesson, generated);
    if (insertedSpeaking) {
      console.log(`  ${fileName}: inserted speaking exercise`);
    }
  }

  if (!dryRun) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`  ${fileName}: saved`);
  }
}

async function main(): Promise<void> {
  console.log('A1 lesson 1 — vocabulary audio + listening lesson\n');
  console.log(
    `  Provider: ${useEdgeTts ? 'Microsoft Edge TTS' : 'Google Translate TTS'} (free)\n`,
  );
  console.log(`  Seed files: ${SEED_FILES.join(', ')}`);
  console.log(`  Output dir: ${UPLOAD_DIR}`);
  console.log(`  Mode: ${dryRun ? 'dry-run' : seedOnly ? 'seed-only' : 'full'}\n`);

  let generated = new Map<string, string>();

  if (!seedOnly) {
    for (const fileName of SEED_FILES) {
      const filePath = path.join(SEED_DIR, fileName);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as SeedFile;
      const mod = findModule(data);
      const vocabLesson = mod?.lessons.find(
        (l) => l.__uuid === VOCAB_LESSON_UUID,
      );
      if (!vocabLesson) {
        throw new Error(`Vocabulary lesson not found in ${fileName}`);
      }
      if (generated.size === 0) {
        generated = await generateAudioFiles(vocabLesson);
      }
    }
  } else {
    for (const vocab of [
      'xin-chao',
      'cam-on',
      'tam-biet',
      'xin-loi',
      'xin-moi',
      'chao-buoi-sang',
      'chao-buoi-chieu',
      'chao-buoi-toi',
      'vang',
      'da',
      'khong',
      'rat-vui',
      'hen-gap-lai',
      'duoc',
    ]) {
      generated.set(vocab, `${AUDIO_URL_PREFIX}/${vocab}.mp3`);
    }
    generated.set(
      'greeting-dialogue',
      `${AUDIO_URL_PREFIX}/greeting-dialogue.mp3`,
    );
  }

  for (const fileName of SEED_FILES) {
    processSeedFile(fileName, generated);
  }

  console.log('\nDone.');
  if (dryRun) {
    console.log('Re-run without --dry-run to write audio files and seeds.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
