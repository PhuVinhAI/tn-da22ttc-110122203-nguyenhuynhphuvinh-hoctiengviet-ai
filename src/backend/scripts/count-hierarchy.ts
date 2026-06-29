import fs from 'fs';
import path from 'path';

const filePath = path.resolve(__dirname, '../../.scratch/seed-data/seed-all.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('=== HIERARCHY ANALYSIS OF COURSES ===');
for (const course of data.courses) {
  console.log(`\nCourse Level: ${course.level} ("${course.title}")`);
  console.log(`Total Modules: ${course.modules.length}`);
  
  course.modules.forEach((mod: any, mIdx: number) => {
    console.log(`  Module ${mIdx + 1}: "${mod.title}"`);
    console.log(`    Lessons: ${mod.lessons.length}`);

    mod.lessons.forEach((les: any, lIdx: number) => {
      console.log(`      Lesson ${lIdx + 1}: "${les.title}"`);
      console.log(`        Contents: ${les.lesson_contents.length}`);
      console.log(`        Vocabularies: ${les.vocabularies.length}`);
      console.log(`        GrammarRules: ${les.grammar_rules.length}`);
      console.log(`        Exercises: ${les.questions.length}`);
    });
  });
}
