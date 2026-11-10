export type Theme = 'light' | 'dark';
type Preference = Theme | 'system';

const STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function storedPreference(): Preference {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === 'light' || stored === 'dark') return stored;
	} catch {
		return 'system';
	}
	return 'system';
}

function apply(theme: Theme) {
	const root = document.documentElement;
	root.classList.add('no-transitions');
	if (theme === 'dark') root.dataset.theme = 'dark';
	else delete root.dataset.theme;
	getComputedStyle(root).opacity;
	requestAnimationFrame(() => root.classList.remove('no-transitions'));
}

class ThemeState {
	preference = $state<Preference>('system');
	systemDark = $state(false);
	resolved = $derived<Theme>(
		this.preference === 'system' ? (this.systemDark ? 'dark' : 'light') : this.preference
	);

	init() {
		const media = matchMedia(DARK_QUERY);
		this.preference = storedPreference();
		this.systemDark = media.matches;
		media.addEventListener('change', (e) => {
			this.systemDark = e.matches;
			apply(this.resolved);
		});
		apply(this.resolved);
	}

	toggle() {
		this.preference = this.resolved === 'dark' ? 'light' : 'dark';
		apply(this.resolved);
		try {
			localStorage.setItem(STORAGE_KEY, this.preference);
		} catch {
			// Storage blocked (private mode): the choice still applies for this session.
		}
	}
}

export const theme = new ThemeState();
