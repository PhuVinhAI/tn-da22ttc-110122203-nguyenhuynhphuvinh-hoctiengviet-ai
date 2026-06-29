import fs from 'fs';
import path from 'path';

const seedDir = path.resolve(__dirname, '../../.scratch/seed-data');
const files = [
  'seed-a1.json',
  'seed-a2.json',
  'seed-b1.json',
  'seed-b2.json',
  'seed-c1.json',
  'seed-c2.json',
  'seed-all.json'
];

function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sortedObj: any = {};
  const sortedKeys = Object.keys(obj).sort();
  for (const key of sortedKeys) {
    sortedObj[key] = sortObjectKeys(obj[key]);
  }
  return sortedObj;
}

function standardizeCourse(course: any): any {
  // Ensure thumbnail_url is present
  if (course.thumbnail_url === undefined) {
    course.thumbnail_url = null;
  }

  // Process modules
  if (Array.isArray(course.modules)) {
    course.modules = course.modules.map((mod: any) => {
      // Process lessons
      if (Array.isArray(mod.lessons)) {
        mod.lessons = mod.lessons.map((les: any) => {
          // Process lesson_contents
          if (Array.isArray(les.lesson_contents)) {
            les.lesson_contents = les.lesson_contents.map((content: any) => {
              return sortObjectKeys(content);
            });
          }

          // Process vocabularies
          if (Array.isArray(les.vocabularies)) {
            les.vocabularies = les.vocabularies.map((vocab: any) => {
              if (vocab.audio_urls === undefined) {
                vocab.audio_urls = null;
              }
              return sortObjectKeys(vocab);
            });
          }

          // Process grammar_rules
          if (Array.isArray(les.grammar_rules)) {
            les.grammar_rules = les.grammar_rules.map((rule: any) => {
              return sortObjectKeys(rule);
            });
          }

          // Process exercises
          if (Array.isArray(les.questions)) {
            les.questions = les.questions.map((ex: any) => {
              return sortObjectKeys(ex);
            });
          }

          return sortObjectKeys(les);
        });
      }
      return sortObjectKeys(mod);
    });
  }

  return sortObjectKeys(course);
}

function processFiles() {
  for (const fileName of files) {
    const filePath = path.join(seedDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }

    console.log(`Processing and standardizing ${fileName}...`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (Array.isArray(data.courses)) {
      data.courses = data.courses.map(standardizeCourse);
    }

    // Write back sorted and standardized JSON
    const standardizedJsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, standardizedJsonStr, 'utf8');
    console.log(`Successfully standardized and wrote ${fileName}.\n`);
  }
}

processFiles();
