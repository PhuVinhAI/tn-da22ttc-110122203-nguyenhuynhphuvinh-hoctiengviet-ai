import fs from 'fs';
import path from 'path';
import type { LessonCatalogEntry } from './types';

const SEED_ALL_PATH = path.resolve(
  __dirname,
  '../../../.scratch/seed-data/seed-all.json',
);

export const SCENARIO_TITLES = [
  'Mua trái cây ở chợ',
  'Đổi trả áo len',
  'Mặc cả quà lưu niệm',
  'Gọi món phở bò',
  'Phàn nàn món ăn lỗi',
  'Đặt tiệc sinh nhật',
  'Hỏi đường đi Hồ Gươm',
  'Bắt taxi đi sân bay',
  'Đổi vé tàu hỏa bị trễ',
  'Khám bệnh cảm cúm',
  'Mua thuốc ở nhà thuốc',
  'Phỏng vấn xin việc',
  'Thương lượng hợp đồng',
  'Làm quen hàng xóm mới',
  'Thuê căn hộ chung cư',
] as const;

export const NATIVE_LANGUAGES = [
  'English',
  'Japanese',
  'Korean',
  'Chinese',
  'French',
  'German',
  'Spanish',
  'Thai',
  'Russian',
  'Portuguese',
] as const;

export const DIALECTS = ['STANDARD', 'NORTHERN', 'SOUTHERN', 'CENTRAL'] as const;

export const FIRST_NAMES: Record<string, string[]> = {
  English: [
    'James',
    'Emma',
    'Oliver',
    'Sophia',
    'Liam',
    'Ava',
    'Noah',
    'Mia',
    'Ethan',
    'Isabella',
  ],
  Japanese: ['Yuki', 'Haruto', 'Sakura', 'Ren', 'Aoi', 'Hinata', 'Sota', 'Mei'],
  Korean: ['Min-jun', 'Seo-yeon', 'Ji-ho', 'Ha-eun', 'Do-yun', 'Su-bin'],
  Chinese: ['Wei', 'Li', 'Mei', 'Jun', 'Ying', 'Chen', 'Xiao', 'Lin'],
  French: ['Pierre', 'Camille', 'Lucas', 'Chloé', 'Antoine', 'Léa'],
  German: ['Lukas', 'Anna', 'Felix', 'Hannah', 'Jonas', 'Marie'],
  Spanish: ['Carlos', 'Lucía', 'Diego', 'Valentina', 'Mateo', 'Sofía'],
  Thai: ['Somchai', 'Nattaya', 'Arun', 'Pim', 'Krit', 'Malee'],
  Russian: ['Ivan', 'Anastasia', 'Dmitri', 'Olga', 'Alexei', 'Katya'],
  Portuguese: ['João', 'Ana', 'Pedro', 'Beatriz', 'Lucas', 'Mariana'],
};

export const LAST_NAMES: Record<string, string[]> = {
  English: ['Smith', 'Johnson', 'Brown', 'Taylor', 'Wilson', 'Davies', 'Miller'],
  Japanese: ['Tanaka', 'Suzuki', 'Sato', 'Yamamoto', 'Watanabe', 'Ito'],
  Korean: ['Kim', 'Park', 'Lee', 'Choi', 'Jung', 'Kang'],
  Chinese: ['Zhang', 'Wang', 'Liu', 'Chen', 'Yang', 'Huang'],
  French: ['Dubois', 'Martin', 'Bernard', 'Petit', 'Moreau', 'Laurent'],
  German: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Becker'],
  Spanish: ['García', 'Rodríguez', 'Martínez', 'López', 'Hernández', 'González'],
  Thai: ['Srisai', 'Boonma', 'Chaiyasit', 'Prasert', 'Wongchai', 'Saetang'],
  Russian: ['Ivanov', 'Smirnov', 'Kuznetsov', 'Popov', 'Volkov', 'Sokolov'],
  Portuguese: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Costa'],
};

let cachedLessons: LessonCatalogEntry[] | null = null;

export function loadLessonCatalog(): LessonCatalogEntry[] {
  if (cachedLessons) return cachedLessons;

  const raw = fs.readFileSync(SEED_ALL_PATH, 'utf8').replace(/^\uFEFF/, '');
  const data = JSON.parse(raw) as {
    courses: Array<{
      __uuid: string;
      level: string;
      modules: Array<{
        __uuid: string;
        lessons: Array<{
          __uuid: string;
          title: string;
          questions?: unknown[];
        }>;
      }>;
    }>;
  };

  const lessons: LessonCatalogEntry[] = [];
  let orderInCourse = 0;

  for (const course of data.courses) {
    orderInCourse = 0;
    for (const module of course.modules ?? []) {
      for (const lesson of module.lessons ?? []) {
        orderInCourse += 1;
        lessons.push({
          ref: lesson.__uuid,
          courseRef: course.__uuid,
          moduleRef: module.__uuid,
          level: course.level,
          title: lesson.title,
          questionCount: lesson.questions?.length ?? 0,
          orderInCourse,
        });
      }
    }
  }

  cachedLessons = lessons;
  return lessons;
}

export function lessonsForLevel(
  catalog: LessonCatalogEntry[],
  level: string,
): LessonCatalogEntry[] {
  return catalog.filter((lesson) => lesson.level === level);
}

export function levelFromCompletedLessons(
  catalog: LessonCatalogEntry[],
  completedCount: number,
): string {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  let remaining = completedCount;

  for (const level of levels) {
    const count = lessonsForLevel(catalog, level).length;
    if (remaining < count) return level;
    remaining -= count;
  }

  return 'C2';
}
