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
	const clean = path.replace(/^\//, '');
	if (lang === defaultLang) return `/${clean}`;
	return clean ? `/${lang}/${clean}` : `/${lang}/`;
}
