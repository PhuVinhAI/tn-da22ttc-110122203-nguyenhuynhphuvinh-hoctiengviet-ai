import pg from 'pg';
import fs from 'fs';
import path from 'path';

const SEED_DATA_PATH = path.resolve(
  __dirname,
  '../../.scratch/seed-data/seed-all.json',
);

async function main() {
  const client = new pg.Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'linvnix',
  });

  await client.connect();
  console.log('Connected to PostgreSQL\n');

  const raw = fs.readFileSync(SEED_DATA_PATH, 'utf8').replace(/^\uFEFF/, '');
  const data = JSON.parse(raw);

  const existing = await client.query('SELECT COUNT(*) FROM courses');
  if (parseInt(existing.rows[0].count) > 0) {
    console.log('Clearing old data...');
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
    totalExercises = 0;

  for (const courseData of data.courses) {
    const fakeUuid = courseData.__uuid;
    const res = await client.query(
      `INSERT INTO courses (title, description, level, order_index, is_published, estimated_hours, vietnamese_level_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        courseData.title,
        courseData.description,
        courseData.level,
        courseData.order_index,
        courseData.is_published,
        courseData.estimated_hours,
        courseData.vietnamese_level_name,
      ],
    );
    const courseId = res.rows[0].id;
    uuidMap.set(fakeUuid, courseId);
    totalCourses++;
    console.log(`Course: ${courseData.title} (${courseData.level}) → ${courseId}`);

    for (const moduleData of courseData.modules) {
      const moduleFakeUuid = moduleData.__uuid;
      const mRes = await client.query(
        `INSERT INTO modules (title, description, order_index, estimated_hours, topic, course_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          moduleData.title,
          moduleData.description,
          moduleData.order_index,
          moduleData.estimated_hours || null,
          moduleData.topic || null,
          courseId,
        ],
      );
      const moduleId = mRes.rows[0].id;
      uuidMap.set(moduleFakeUuid, moduleId);
      totalModules++;

      for (const lessonData of moduleData.lessons) {
        const lessonFakeUuid = lessonData.__uuid;
        const lRes = await client.query(
          `INSERT INTO lessons (title, description, lesson_type, order_index, estimated_duration, is_assessment, module_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [
            lessonData.title,
            lessonData.description,
            lessonData.lesson_type,
            lessonData.order_index,
            lessonData.estimated_duration || null,
            lessonData.is_assessment || false,
            moduleId,
          ],
        );
        const lessonId = lRes.rows[0].id;
        uuidMap.set(lessonFakeUuid, lessonId);
        totalLessons++;

        for (const contentData of lessonData.lesson_contents) {
          await client.query(
            `INSERT INTO lesson_contents (content_type, vietnamese_text, translation, phonetic, audio_url, image_url, video_url, order_index, notes, lesson_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              contentData.content_type,
              contentData.vietnamese_text,
              contentData.translation || null,
              contentData.phonetic || null,
              contentData.audio_url || null,
              contentData.image_url || null,
              contentData.video_url || null,
              contentData.order_index,
              contentData.notes || null,
              lessonId,
            ],
          );
          totalContents++;
        }

        for (const vocabData of lessonData.vocabularies) {
          await client.query(
            `INSERT INTO vocabularies (word, translation, phonetic, part_of_speech, example_sentence, example_translation, audio_url, image_url, classifier, dialect_variants, audio_urls, region, difficulty_level, lesson_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [
              vocabData.word,
              vocabData.translation,
              vocabData.phonetic || null,
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
              vocabData.difficulty_level || 1,
              lessonId,
            ],
          );
          totalVocab++;
        }

        for (const grammarData of lessonData.grammar_rules) {
          await client.query(
            `INSERT INTO grammar_rules (title, explanation, structure, examples, notes, difficulty_level, lesson_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              grammarData.title,
              grammarData.explanation,
              grammarData.structure || null,
              JSON.stringify(grammarData.examples),
              grammarData.notes || null,
              grammarData.difficulty_level || 1,
              lessonId,
            ],
          );
          totalGrammar++;
        }

        for (const exerciseData of lessonData.exercises) {
          await client.query(
            `INSERT INTO exercises (exercise_type, question, question_audio_url, options, correct_answer, explanation, order_index, difficulty_level, lesson_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              exerciseData.exercise_type,
              exerciseData.question,
              exerciseData.question_audio_url || null,
              exerciseData.options ? JSON.stringify(exerciseData.options) : null,
              JSON.stringify(exerciseData.correct_answer),
              exerciseData.explanation || null,
              exerciseData.order_index,
              exerciseData.difficulty_level || 1,
              lessonId,
            ],
          );
          totalExercises++;
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
  console.log(`Exercises:       ${totalExercises}`);

  await client.end();
}

main().catch((err) => {
  console.error('Seed error:', err.message || err);
  process.exit(1);
});
