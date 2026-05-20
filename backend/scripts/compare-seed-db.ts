import fs from 'fs';
import path from 'path';

// Seed paths
const seedAllPath = path.resolve(__dirname, '../../.scratch/seed-data/seed-all.json');
const seedData = JSON.parse(fs.readFileSync(seedAllPath, 'utf8'));

// Entity files (we will parse properties decorated with @Column)
const entityPaths = {
  course: path.resolve(__dirname, '../src/modules/courses/domain/course.entity.ts'),
  module: path.resolve(__dirname, '../src/modules/courses/domain/module.entity.ts'),
  lesson: path.resolve(__dirname, '../src/modules/courses/domain/lesson.entity.ts'),
  lesson_content: path.resolve(__dirname, '../src/modules/contents/domain/lesson-content.entity.ts'),
  vocabulary: path.resolve(__dirname, '../src/modules/vocabularies/domain/vocabulary.entity.ts'),
  grammar_rule: path.resolve(__dirname, '../src/modules/grammar/domain/grammar-rule.entity.ts'),
  exercise: path.resolve(__dirname, '../src/modules/exercises/domain/exercise.entity.ts')
};

function getEntityFields(filePath: string): string[] {
  if (!fs.existsSync(filePath)) {
    console.log(`Warning: ${filePath} does not exist.`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all property declarations that have @Column decorator
  // We can do a simple regex search
  const regex = /@Column\([\s\S]*?\)\s*(\w+)(\??)\s*:/g;
  const fields: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    fields.push(match[1]);
  }
  return fields;
}

console.log('=== COMPARING DATABASE ENTITY FIELDS WITH SEED JSON KEYS ===');

const mapSeedTypes = {
  course: seedData.courses[0],
  module: seedData.courses[0].modules[0],
  lesson: seedData.courses[0].modules[0].lessons[0],
  lesson_content: seedData.courses[0].modules[0].lessons[0].lesson_contents[0],
  vocabulary: seedData.courses[0].modules[0].lessons[0].vocabularies[0],
  grammar_rule: seedData.courses[0].modules[0].lessons[0].grammar_rules[0], // wait, might be undefined if A1 lesson 1 grammar_rules is empty, let's look for one
  exercise: seedData.courses[0].modules[0].lessons[0].exercises[0]
};

// Let's find a grammar rule in seed data
let grammarSample: any = null;
for (const c of seedData.courses) {
  for (const m of c.modules) {
    for (const l of m.lessons) {
      if (l.grammar_rules && l.grammar_rules.length > 0) {
        grammarSample = l.grammar_rules[0];
        break;
      }
    }
    if (grammarSample) break;
  }
  if (grammarSample) break;
}
if (grammarSample) {
  mapSeedTypes.grammar_rule = grammarSample;
}

for (const [entityName, filePath] of Object.entries(entityPaths)) {
  const dbFields = getEntityFields(filePath);
  const seedObj = mapSeedTypes[entityName as keyof typeof mapSeedTypes];
  const seedKeys = seedObj ? Object.keys(seedObj) : [];
  
  console.log(`\nEntity: ${entityName}`);
  console.log(`  TypeORM @Column fields (camelCase):`, dbFields.sort());
  console.log(`  Seed JSON keys:                    `, seedKeys.sort());
  
  // Convert camelCase to snake_case or check direct matches
  // Seed data keys are snake_case except a few. Let's see how they match.
  const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  const toCamelCase = (str: string) => str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));
  
  const unmatchedDbFields = dbFields.filter(f => {
    // Check if camelCase matches seedKeys directly, or when converted to snake_case
    const snake = toSnakeCase(f);
    return !seedKeys.includes(f) && !seedKeys.includes(snake);
  });
  
  const unmatchedSeedKeys = seedKeys.filter(k => {
    if (k.startsWith('__')) return false; // skip __uuid
    if (['modules', 'lessons', 'lesson_contents', 'vocabularies', 'grammar_rules', 'exercises'].includes(k)) return false;
    const camel = toCamelCase(k);
    return !dbFields.includes(k) && !dbFields.includes(camel);
  });
  
  if (unmatchedDbFields.length > 0) {
    console.log(`  [MISSING IN SEED] Fields in DB but not in Seed:`, unmatchedDbFields);
  } else {
    console.log(`  [OK] All DB fields are represented in Seed.`);
  }
  
  if (unmatchedSeedKeys.length > 0) {
    console.log(`  [EXTRA IN SEED] Keys in Seed but not in DB:   `, unmatchedSeedKeys);
  } else {
    console.log(`  [OK] No extra keys in Seed.`);
  }
}
