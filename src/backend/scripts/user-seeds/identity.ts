import { faker, allFakers, type Faker } from '@faker-js/faker';
import { bool, intBetween, mulberry32, pick } from './rng';

export const NATIVE_LANGUAGES = [
  'English',
  'Chinese',
  'Japanese',
  'Korean',
  'French',
  'German',
  'Spanish',
  'Thai',
  'Vietnamese',
] as const;

export type NativeLanguage = (typeof NATIVE_LANGUAGES)[number];

const FAKER_LOCALE: Record<NativeLanguage, keyof typeof allFakers> = {
  English: 'en',
  Chinese: 'zh_CN',
  Japanese: 'ja',
  Korean: 'ko',
  French: 'fr',
  German: 'de',
  Spanish: 'es',
  Thai: 'en',
  Vietnamese: 'vi',
};

const EMAIL_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'hotmail.com',
  'proton.me',
  'live.com',
  'mail.com',
];

export interface GeneratedIdentity {
  fullName: string;
  firstName: string;
  lastName: string;
  nativeLanguage: NativeLanguage;
  email: string;
  provider: 'local' | 'google';
  googleId: string | null;
  avatarUrl: string | null;
  password: string | null;
}

function fakerForLanguage(language: NativeLanguage, seed: number) {
  const locale = FAKER_LOCALE[language];
  const instance = allFakers[locale] ?? faker;
  instance.seed(seed);
  return instance;
}

function buildEmail(
  f: Faker,
  firstName: string,
  lastName: string,
  rng: () => number,
): string {
  const first = firstName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const last = lastName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const domain = pick(rng, EMAIL_DOMAINS);
  const year = intBetween(rng, 1985, 2004);

  const localPart = pick(rng, [
    `${first}.${last}`,
    `${first}${last}`,
    `${first}.${last}${year}`,
    `${first[0] ?? 'u'}${last}${intBetween(rng, 1, 99)}`,
    `${first}${intBetween(rng, 10, 999)}`,
    `${last}.${first}`,
  ]);

  if (bool(rng, 0.55)) {
    return f.internet.email({ firstName, lastName, provider: domain }).toLowerCase();
  }

  return `${localPart}@${domain}`;
}

export function generateIdentity(
  index: number,
  provider: 'local' | 'google',
): GeneratedIdentity {
  const rng = mulberry32(index * 7919 + 17);
  const nativeLanguage = pick(rng, [...NATIVE_LANGUAGES]);
  const f = fakerForLanguage(nativeLanguage, index * 7919 + 17);

  const sex = bool(rng, 0.5) ? ('female' as const) : ('male' as const);
  const firstName = f.person.firstName(sex);
  const lastName = f.person.lastName(sex);
  const fullName = `${firstName} ${lastName}`;

  return {
    fullName,
    firstName,
    lastName,
    nativeLanguage,
    email: buildEmail(f, firstName, lastName, rng),
    provider,
    googleId: provider === 'google' ? f.string.numeric(21) : null,
    avatarUrl: provider === 'google' ? f.image.avatarGitHub() : null,
    password: provider === 'google' ? null : 'SeedPass2026!',
  };
}

export function pickDialect(rng: () => number): string {
  return pick(rng, ['STANDARD', 'NORTHERN', 'CENTRAL', 'SOUTHERN']);
}

export function pickOnboardingLevel(rng: () => number): string {
  return pick(rng, [
    'A1',
    'A1',
    'A1',
    'A2',
    'A2',
    'B1',
    'B1',
    'B2',
    'C1',
  ]);
}
