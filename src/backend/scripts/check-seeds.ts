import fs from 'fs';
import path from 'path';

const seedDir = path.resolve(__dirname, '../../.scratch/seed-data');
const files = ['seed-a1.json', 'seed-a2.json', 'seed-b1.json', 'seed-b2.json', 'seed-c1.json', 'seed-c2.json'];

function checkFilesConsistency() {
  const schemas: Record<string, Set<string>> = {
    course: new Set(),
    module: new Set(),
    lesson: new Set(),
    lesson_content: new Set(),
    vocabulary: new Set(),
    grammar_rule: new Set(),
    question: new Set()
  };

  const records: Record<string, { file: string; data: any }[]> = {
    course: [],
    module: [],
    lesson: [],
    lesson_content: [],
    vocabulary: [],
    grammar_rule: [],
    question: []
  };

  for (const fileName of files) {
    const filePath = path.join(seedDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.log(`Missing file: ${fileName}`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    for (const course of data.courses || []) {
      records.course.push({ file: fileName, data: course });
      Object.keys(course).forEach(k => schemas.course.add(k));
      
      for (const mod of course.modules || []) {
        records.module.push({ file: fileName, data: mod });
        Object.keys(mod).forEach(k => schemas.module.add(k));
        
        for (const les of mod.lessons || []) {
          records.lesson.push({ file: fileName, data: les });
          Object.keys(les).forEach(k => schemas.lesson.add(k));
          
          for (const content of les.lesson_contents || []) {
            records.lesson_content.push({ file: fileName, data: content });
            Object.keys(content).forEach(k => schemas.lesson_content.add(k));
          }
          for (const vocab of les.vocabularies || []) {
            records.vocabulary.push({ file: fileName, data: vocab });
            Object.keys(vocab).forEach(k => schemas.vocabulary.add(k));
          }
          for (const grammar of les.grammar_rules || []) {
            records.grammar_rule.push({ file: fileName, data: grammar });
            Object.keys(grammar).forEach(k => schemas.grammar_rule.add(k));
          }
          for (const ex of les.questions || []) {
            records.exercise.push({ file: fileName, data: ex });
            Object.keys(ex).forEach(k => schemas.exercise.add(k));
          }
        }
      }
    }
  }

  console.log('=== Checking Keys across all separate seed files ===');
  for (const type of Object.keys(schemas)) {
    console.log(`\nEntity [${type}] keys:`, Array.from(schemas[type]).sort());
    const uniqueKeys = Array.from(schemas[type]);
    
    for (const key of uniqueKeys) {
      if (['modules', 'lessons', 'lesson_contents', 'vocabularies', 'grammar_rules', 'exercises'].includes(key)) continue;
      
      const missingInFiles: Record<string, number> = {};
      for (const rec of records[type]) {
        if (rec.data[key] === undefined) {
          missingInFiles[rec.file] = (missingInFiles[rec.file] || 0) + 1;
        }
      }
      if (Object.keys(missingInFiles).length > 0) {
        console.log(`  Key "${key}" is missing in:`, missingInFiles);
      }
    }
  }

  // Compare separate seed files with seed-all.json to see if they match exactly
  const allFilePath = path.join(seedDir, 'seed-all.json');
  if (fs.existsSync(allFilePath)) {
    const allData = JSON.parse(fs.readFileSync(allFilePath, 'utf8'));
    console.log(`\n=== Comparing separate files with seed-all.json ===`);
    
    for (const fileName of files) {
      const filePath = path.join(seedDir, fileName);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Find matching course in seed-all.json
      for (const separateCourse of data.courses || []) {
        const matchingCourse = allData.courses.find((c: any) => c.level === separateCourse.level);
        if (!matchingCourse) {
          console.log(`  Course Level ${separateCourse.level} (from ${fileName}) not found in seed-all.json!`);
          continue;
        }
        
        // Deep compare
        const sepStr = JSON.stringify(separateCourse);
        const allStr = JSON.stringify(matchingCourse);
        if (sepStr === allStr) {
          console.log(`  Course Level ${separateCourse.level} in ${fileName} matches seed-all.json exactly.`);
        } else {
          console.log(`  !!! Course Level ${separateCourse.level} in ${fileName} DOES NOT MATCH seed-all.json.`);
          // Let's print length comparison
          console.log(`      Length in ${fileName}: ${sepStr.length}, Length in seed-all.json: ${allStr.length}`);
        }
      }
    }
  }
}

checkFilesConsistency();
