import 'overlayscrollbars/overlayscrollbars.css';
import { OverlayScrollbars } from 'overlayscrollbars';

/** Pass `viewport` to keep an existing element as the scroller (CodeMirror, scroll-synced panes). */
export function scroll(node: HTMLElement, viewport?: HTMLElement) {
	const instance = OverlayScrollbars(
		viewport ? { target: node, elements: { viewport, content: false, padding: false } } : node,
		{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 600 } }
	);
	return { destroy: () => instance.destroy() };
}
