export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function initialTheme(): Theme {
	if (typeof window === 'undefined') return 'light';
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === 'dark' ? 'dark' : 'light';
}

function apply(theme: Theme) {
	if (typeof document === 'undefined') return;
	if (theme === 'dark') document.documentElement.dataset.theme = 'dark';
	else delete document.documentElement.dataset.theme;
}

class ThemeState {
	current = $state<Theme>(initialTheme());

	init() {
		apply(this.current);
	}

	toggle() {
		this.current = this.current === 'dark' ? 'light' : 'dark';
		apply(this.current);
		try {
			localStorage.setItem(STORAGE_KEY, this.current);
		} catch (_) {
			// localStorage unavailable; theme is still applied in-memory
		}
	}
}

export const theme = new ThemeState();
