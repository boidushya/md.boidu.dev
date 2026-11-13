import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
import { ariaKeyshortcuts, keysOf, type ShortcutId } from '$lib/shortcuts';

export interface TooltipOptions {
	label: string;
	shortcut?: ShortcutId;
}

const SHOW_DELAY = 400;
const WARM_MS = 300;
const ARROW_PATH = 'M0 0 L5 5 L10 0';

let open = 0;
let lastClosedAt = 0;

const isWarm = () => open > 0 || performance.now() - lastClosedAt < WARM_MS;

function build({ label, shortcut }: TooltipOptions): { root: HTMLElement; arrowEl: SVGElement } {
	const root = document.createElement('div');
	root.className = 'tooltip';
	root.setAttribute('aria-hidden', 'true');

	const body = document.createElement('div');
	body.className = 'tooltip-body';
	body.textContent = label;
	if (shortcut) {
		const keys = document.createElement('span');
		keys.className = 'tooltip-keys';
		for (const key of keysOf(shortcut)) {
			const kbd = document.createElement('kbd');
			kbd.textContent = key;
			keys.appendChild(kbd);
		}
		body.appendChild(keys);
	}

	const arrowEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	arrowEl.setAttribute('class', 'tooltip-arrow');
	arrowEl.setAttribute('width', '10');
	arrowEl.setAttribute('height', '5');
	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('d', ARROW_PATH);
	arrowEl.appendChild(path);

	root.appendChild(body);
	root.appendChild(arrowEl);
	return { root, arrowEl };
}

export function tooltip(node: HTMLElement, initial: TooltipOptions) {
	let options = initial;
	let current: { root: HTMLElement; stop: () => void } | null = null;
	let timer: ReturnType<typeof setTimeout> | undefined;

	function setAria() {
		if (options.shortcut) node.setAttribute('aria-keyshortcuts', ariaKeyshortcuts(options.shortcut));
		else node.removeAttribute('aria-keyshortcuts');
	}

	function show() {
		if (current) return;
		const { root, arrowEl } = build(options);
		root.classList.toggle('instant', isWarm());
		document.body.appendChild(root);
		open++;

		const position = () =>
			computePosition(node, root, {
				placement: 'bottom',
				strategy: 'fixed',
				middleware: [offset(8), flip(), shift({ padding: 8 }), arrow({ element: arrowEl, padding: 6 })]
			}).then(({ x, y, placement, middlewareData }) => {
				root.style.translate = `${x}px ${y}px`;
				root.dataset.side = placement;
				arrowEl.style.left = `${middlewareData.arrow?.x ?? 0}px`;
				root.style.setProperty('--origin-x', `${(middlewareData.arrow?.x ?? 0) + 5}px`);
			});
		current = { root, stop: autoUpdate(node, root, position) };
	}

	function hide() {
		clearTimeout(timer);
		if (!current) return;
		current.stop();
		current.root.remove();
		current = null;
		open--;
		lastClosedAt = performance.now();
	}

	function schedule() {
		clearTimeout(timer);
		if (isWarm()) show();
		else timer = setTimeout(show, SHOW_DELAY);
	}

	function onPointerEnter(e: PointerEvent) {
		if (e.pointerType === 'mouse') schedule();
	}

	function onFocus() {
		if (node.matches(':focus-visible')) show();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') hide();
	}

	setAria();
	node.addEventListener('pointerenter', onPointerEnter);
	node.addEventListener('pointerleave', hide);
	node.addEventListener('pointerdown', hide);
	node.addEventListener('focus', onFocus);
	node.addEventListener('blur', hide);
	window.addEventListener('keydown', onKeydown);

	return {
		update(next: TooltipOptions) {
			options = next;
			setAria();
			if (current) {
				hide();
				show();
			}
		},
		destroy() {
			hide();
			node.removeEventListener('pointerenter', onPointerEnter);
			node.removeEventListener('pointerleave', hide);
			node.removeEventListener('pointerdown', hide);
			node.removeEventListener('focus', onFocus);
			node.removeEventListener('blur', hide);
			window.removeEventListener('keydown', onKeydown);
		}
	};
}
