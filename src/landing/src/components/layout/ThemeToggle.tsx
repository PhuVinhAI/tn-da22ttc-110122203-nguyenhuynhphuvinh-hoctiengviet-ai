import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function readTheme(): Theme {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'light' || stored === 'dark') return stored;
	return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function applyTheme(next: Theme) {
	const root = document.documentElement;
	root.classList.remove('light', 'dark');
	root.classList.add(next);
	localStorage.setItem(STORAGE_KEY, next);
}

export function ThemeToggle({ labels }: { labels: { light: string; dark: string } }) {
	const [theme, setTheme] = useState<Theme>('light');
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setTheme(readTheme());
		setMounted(true);
	}, []);

	const toggle = () => {
		const next: Theme = theme === 'light' ? 'dark' : 'light';
		applyTheme(next);
		setTheme(next);
	};

	const isDark = theme === 'dark';
	const ariaLabel = isDark ? labels.light : labels.dark;

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={ariaLabel}
			title={ariaLabel}
			className="inline-flex items-center justify-center size-9 rounded-full border border-border bg-transparent text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
		>
			{mounted ? (
				isDark ? <Sun className="size-4" /> : <Moon className="size-4" />
			) : (
				<span className="size-4" />
			)}
		</button>
	);
}
