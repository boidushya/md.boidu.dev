const hasNavigator = typeof navigator !== 'undefined';

export const isMac = hasNavigator && /Mac|iPhone|iPad/.test(navigator.userAgent);

export const modKey = isMac ? '⌘' : 'Ctrl';

export function isTouch(): boolean {
	return typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
}
