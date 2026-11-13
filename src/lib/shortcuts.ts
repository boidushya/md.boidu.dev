import { isMac } from '$lib/utils/platform';

interface Shortcut {
	combo: string;
	label: string;
}

export const shortcuts = {
	bold: { combo: 'Mod-b', label: 'Bold' },
	italic: { combo: 'Mod-i', label: 'Italic' },
	code: { combo: 'Mod-e', label: 'Inline code' },
	strike: { combo: 'Mod-Shift-x', label: 'Strikethrough' },
	link: { combo: 'Mod-k', label: 'Link' },
	quote: { combo: 'Mod-Shift-.', label: 'Quote' },
	orderedList: { combo: 'Mod-Shift-7', label: 'Numbered list' },
	bulletList: { combo: 'Mod-Shift-8', label: 'Bulleted list' },
	editorView: { combo: 'Mod-Alt-1', label: 'Editor view' },
	splitView: { combo: 'Mod-Alt-2', label: 'Split view' },
	previewView: { combo: 'Mod-Alt-3', label: 'Preview view' },
	sidebar: { combo: 'Mod-\\', label: 'Toggle sidebar' },
	newProject: { combo: 'Mod-Alt-n', label: 'New project' },
	prevProject: { combo: 'Mod-Alt-ArrowUp', label: 'Previous project' },
	nextProject: { combo: 'Mod-Alt-ArrowDown', label: 'Next project' },
	rename: { combo: 'F2', label: 'Rename project' },
	theme: { combo: 'Mod-Shift-l', label: 'Toggle theme' },
	save: { combo: 'Mod-s', label: 'Save now' },
	share: { combo: 'Mod-Shift-s', label: 'Share snapshot' },
	help: { combo: 'Mod-/', label: 'Keyboard shortcuts' }
} as const satisfies Record<string, Shortcut>;

export type ShortcutId = keyof typeof shortcuts;

export const shortcutSections: { title: string; ids: ShortcutId[] }[] = [
	{
		title: 'Formatting',
		ids: ['bold', 'italic', 'code', 'strike', 'link', 'quote', 'orderedList', 'bulletList']
	},
	{
		title: 'View',
		ids: ['editorView', 'splitView', 'previewView', 'sidebar', 'theme']
	},
	{
		title: 'Projects',
		ids: ['newProject', 'prevProject', 'nextProject', 'rename', 'save', 'share', 'help']
	}
];

const SYMBOLS: Record<string, string> = isMac
	? { Mod: '⌘', Alt: '⌥', Shift: '⇧', ArrowUp: '↑', ArrowDown: '↓' }
	: { Mod: 'Ctrl', Alt: 'Alt', Shift: 'Shift', ArrowUp: '↑', ArrowDown: '↓' };

const CODES: Record<string, string> = { '\\': 'Backslash', '/': 'Slash', '.': 'Period' };

function parse(id: ShortcutId): { mods: Set<string>; key: string } {
	const parts = shortcuts[id].combo.split('-');
	return { mods: new Set(parts.slice(0, -1)), key: parts[parts.length - 1] };
}

function physicalCode(key: string): string {
	if (/^[a-z]$/.test(key)) return `Key${key.toUpperCase()}`;
	if (/^\d$/.test(key)) return `Digit${key}`;
	return CODES[key] ?? key;
}

export function keysOf(id: ShortcutId): string[] {
	return shortcuts[id].combo
		.split('-')
		.map((part) => SYMBOLS[part] ?? (part.length === 1 ? part.toUpperCase() : part));
}

export function ariaKeyshortcuts(id: ShortcutId): string {
	return shortcuts[id].combo
		.split('-')
		.map((part) => (part === 'Mod' ? (isMac ? 'Meta' : 'Control') : part))
		.join('+');
}

export function matches(e: KeyboardEvent, id: ShortcutId): boolean {
	const { mods, key } = parse(id);
	const mod = isMac ? e.metaKey : e.ctrlKey;
	const stray = isMac ? e.ctrlKey : e.metaKey;
	return (
		e.code === physicalCode(key) &&
		mod === mods.has('Mod') &&
		e.altKey === mods.has('Alt') &&
		e.shiftKey === mods.has('Shift') &&
		!stray
	);
}
