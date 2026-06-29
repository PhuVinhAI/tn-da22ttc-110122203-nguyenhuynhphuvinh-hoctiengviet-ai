import pg from 'pg';
import fs from 'fs';
import path from 'path';

const SEED_DATA_PATH = path.resolve(
  __dirname,
  '../../.scratch/seed-data/seed-all.json',
);

async function main() {
  const url = process.env.DATABASE_URL;
  const useSSL =
    process.env.DATABASE_SSL === 'true' ||
    (url ? /sslmode=(require|verify)/.test(url) : false);
  const sslOption = useSSL ? { rejectUnauthorized: false } : false;

  const client = url
    ? new pg.Client({ connectionString: url, ssl: sslOption })
    : new pg.Client({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'linvnix',
        ssl: sslOption,
      });

  await client.connect();
  console.log('Connected to PostgreSQL\n');

  const raw = fs.readFileSync(SEED_DATA_PATH, 'utf8').replace(/^﻿/, '');
  const data = JSON.parse(raw);

  const existing = await client.query('SELECT COUNT(*) FROM courses');
  if (parseInt(existing.rows[0].count) > 0) {
    console.log('Clearing old data...');
    await client.query('DELETE FROM questions');
    await client.query('DELETE FROM exercises');
    await client.query('DELETE FROM grammar_rules');
    await client.query('DELETE FROM vocabularies');
    await client.query('DELETE FROM lesson_contents');
    await client.query('DELETE FROM lessons');
    await client.query('DELETE FROM modules');
    await client.query('DELETE FROM courses');
    console.log('Old data cleared.\n');
  }

  const uuidMap = new Map<string, string>();
  let totalCourses = 0,
    totalModules = 0,
    totalLessons = 0,
    totalContents = 0,
    totalVocab = 0,
    totalGrammar = 0,
    totalQuestions = 0;

  for (const courseData of data.courses) {
    const fakeUuid = courseData.__uuid;
    const res = await client.query(
      `INSERT INTO courses (title, description, level, order_index, is_published, estimated_hours, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        courseData.title,
        courseData.description,
        courseData.level,
        courseData.order_index,
        courseData.is_published,
        courseData.estimated_hours,
        courseData.thumbnail_url || null,
      ],
    );
    const courseId = res.rows[0].id;
    uuidMap.set(fakeUuid, courseId);
    totalCourses++;
    console.log(`Course: ${courseData.title} (${courseData.level}) → ${courseId}`);

    for (const moduleData of courseData.modules) {
      const moduleFakeUuid = moduleData.__uuid;
      const mRes = await client.query(
        `INSERT INTO modules (title, description, order_index, estimated_hours, course_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          moduleData.title,
          moduleData.description,
          moduleData.order_index,
          moduleData.estimated_hours || null,
          courseId,
        ],
      );
      const moduleId = mRes.rows[0].id;
      uuidMap.set(moduleFakeUuid, moduleId);
      totalModules++;

      for (const lessonData of moduleData.lessons) {
        const lessonFakeUuid = lessonData.__uuid;
        const lRes = await client.query(
          `INSERT INTO lessons (title, description, order_index, estimated_duration, module_id)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [
            lessonData.title,
            lessonData.description,
            lessonData.order_index,
            lessonData.estimated_duration || null,
            moduleId,
          ],
        );
        const lessonId = lRes.rows[0].id;
        uuidMap.set(lessonFakeUuid, lessonId);
        totalLessons++;

        // Chỉ giữ nội dung văn bản; bỏ qua dialogue / image / audio / video.
        let nextOrder = 0;
        for (const contentData of lessonData.lesson_contents) {
          if (contentData.content_type && contentData.content_type !== 'text') {
            continue;
          }
          await client.query(
            `INSERT INTO lesson_contents (vietnamese_text, translation, order_index, notes, lesson_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              contentData.vietnamese_text,
              contentData.translation || null,
              nextOrder++,
              contentData.notes || null,
              lessonId,
            ],
          );
          totalContents++;
        }

        for (const vocabData of lessonData.vocabularies) {
          await client.query(
            `INSERT INTO vocabularies (word, translation, part_of_speech, example_sentence, example_translation, audio_url, image_url, classifier, dialect_variants, audio_urls, region, lesson_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              vocabData.word,
              vocabData.translation,
              vocabData.part_of_speech,
              vocabData.example_sentence || null,
              vocabData.example_translation || null,
              vocabData.audio_url || null,
              vocabData.image_url || null,
              vocabData.classifier || null,
              vocabData.dialect_variants
                ? JSON.stringify(vocabData.dialect_variants)
                : null,
              vocabData.audio_urls ? JSON.stringify(vocabData.audio_urls) : null,
              vocabData.region || null,
              lessonId,
            ],
          );
          totalVocab++;
        }

        for (const grammarData of lessonData.grammar_rules) {
          await client.query(
            `INSERT INTO grammar_rules (title, explanation, structure, examples, notes, lesson_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              grammarData.title,
              grammarData.explanation,
              grammarData.structure || null,
              JSON.stringify(grammarData.examples),
              grammarData.notes || null,
              lessonId,
            ],
          );
          totalGrammar++;
        }

        const lessonQuestions = lessonData.questions ?? [];
        if (lessonQuestions.length > 0) {
          const setRes = await client.query(
            `INSERT INTO exercises (lesson_id, is_custom, is_ai_generated, title, order_index)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [lessonId, false, false, 'Basic Exercises', 0],
          );
          const exerciseId = setRes.rows[0].id;

          for (let i = 0; i < lessonQuestions.length; i++) {
            const questionData = lessonQuestions[i];
            await client.query(
              `INSERT INTO questions (question_type, question, question_audio_url, options, correct_answer, explanation, order_index, exercise_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                questionData.question_type,
                questionData.question ?? null,
                questionData.question_audio_url || null,
                questionData.options
                  ? JSON.stringify(questionData.options)
                  : null,
                JSON.stringify(questionData.correct_answer),
                questionData.explanation || null,
                i + 1,
                exerciseId,
              ],
            );
            totalQuestions++;
          }
        }
      }
    }
  }

  console.log('\n=== Seed completed! ===');
  console.log(`Courses:         ${totalCourses}`);
  console.log(`Modules:         ${totalModules}`);
  console.log(`Lessons:         ${totalLessons}`);
  console.log(`LessonContents:  ${totalContents}`);
  console.log(`Vocabularies:    ${totalVocab}`);
  console.log(`GrammarRules:    ${totalGrammar}`);
  console.log(`Questions:       ${totalQuestions}`);

  await client.end();
}

main().catch((err) => {
  console.error('Seed error:', err.message || err);
  process.exit(1);
});
