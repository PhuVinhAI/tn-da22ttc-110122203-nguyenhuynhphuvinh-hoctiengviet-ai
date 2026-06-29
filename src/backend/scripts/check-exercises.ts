import fs from 'fs';
import path from 'path';

const seedAllPath = path.resolve(__dirname, '../../.scratch/seed-data/seed-all.json');
const seedData = JSON.parse(fs.readFileSync(seedAllPath, 'utf8'));

const questionTypes = new Set<string>();
const optionsKeys = new Set<string>();
const answerKeys = new Set<string>();

for (const course of seedData.courses) {
  for (const mod of course.modules) {
    for (const les of mod.lessons) {
      for (const ex of les.questions || []) {
        questionTypes.add(ex.question_type);
        if (ex.options) {
          Object.keys(ex.options).forEach(k => optionsKeys.add(k));
        }
        if (ex.correct_answer) {
          Object.keys(ex.correct_answer).forEach(k => answerKeys.add(k));
        }
      }
    }
  }
}

console.log('Exercise Types found:', Array.from(questionTypes));
console.log('Options Keys found:', Array.from(optionsKeys));
console.log('Answer Keys found:', Array.from(answerKeys));
