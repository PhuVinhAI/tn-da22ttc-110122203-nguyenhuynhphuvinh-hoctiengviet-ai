import { defaultLang, type Lang, languages } from './config';
import { ui, type TranslationKey } from './ui';

export function getLangFromUrl(url: URL): Lang {
	const [, lang] = url.pathname.split('/');
	if (lang && lang in languages) return lang as Lang;
	return defaultLang;
}

export function useTranslations(lang: Lang) {
	return function t(key: TranslationKey): string {
		return ui[lang][key] ?? ui[defaultLang][key];
	};
}

export function localizedPath(lang: Lang, path: string = ''): string {
	const base = import.meta.env.BASE_URL;
	const clean = path.replace(/^\//, '');
	const langSegment = lang === defaultLang ? '' : `${lang}/`;
	return `${base}${langSegment}${clean}`;
}
