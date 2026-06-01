export const languages = {
	en: 'English',
	vi: 'Tiếng Việt',
	de: 'Deutsch',
	es: 'Español',
	fr: 'Français',
	ja: '日本語',
	ko: '한국어',
	th: 'ไทย',
	zh: '中文',
} as const;

export const defaultLang = 'en' as const;

export type Lang = keyof typeof languages;

export const localeOrder: Lang[] = ['en', 'vi', 'de', 'es', 'fr', 'ja', 'ko', 'th', 'zh'];
