<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { editorState } from '$lib/stores/editor.svelte';
	import { EditorView, keymap, placeholder } from '@codemirror/view';
	import { EditorState, type Extension } from '@codemirror/state';
	import { markdown } from '@codemirror/lang-markdown';
	import { languages } from '@codemirror/language-data';
	import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
	import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
	import { tags as t } from '@lezer/highlight';
	import { scroll } from '$lib/actions/scroll';
	import { formatKeymap } from '$lib/editor/format';

	const mdHighlight = HighlightStyle.define([
		{ tag: t.heading, color: 'var(--color-text)', fontWeight: '600' },
		{ tag: t.strong, fontWeight: '700' },
		{ tag: t.emphasis, fontStyle: 'italic' },
		{ tag: t.strikethrough, textDecoration: 'line-through' },
		{ tag: t.link, color: 'var(--color-accent)' },
		{ tag: t.url, color: 'var(--hl-muted)', textDecoration: 'underline' },
		{ tag: t.monospace, color: 'var(--hl-string)' },
		{ tag: t.quote, color: 'var(--color-text-muted)', fontStyle: 'italic' },
		{ tag: t.meta, color: 'var(--hl-muted)' },
		{ tag: t.processingInstruction, color: 'var(--hl-muted)' },
		{ tag: t.contentSeparator, color: 'var(--hl-muted)' },
		{ tag: t.list, color: 'var(--hl-keyword)' },
		{ tag: [t.keyword, t.number, t.bool, t.null, t.typeName, t.tagName], color: 'var(--hl-keyword)' },
		{ tag: [t.string, t.regexp, t.special(t.string)], color: 'var(--hl-string)' },
		{ tag: t.comment, color: 'var(--hl-comment)', fontStyle: 'italic' },
		{ tag: t.function(t.variableName), fontWeight: '500' },
		{ tag: [t.punctuation, t.operator], color: 'var(--hl-muted)' }
	]);

	interface Props {
		onScroll?: (scrollRatio: number) => void;
		scrollRatio?: number;
	}

	let { onScroll, scrollRatio }: Props = $props();

	let editorContainer: HTMLDivElement;
	let view: EditorView;
	let isScrolling = false;
	let scrollbars: { destroy: () => void } | undefined;

	const theme = EditorView.theme({
		'&': {
			height: '100%',
			fontSize: '14px'
		},
		'.cm-scroller': {
			fontFamily: 'var(--font-mono)',
			lineHeight: '1.7',
			overscrollBehavior: 'contain'
		},
		'.cm-content': {
			caretColor: 'var(--color-text)',
			padding: 'calc(var(--space-unit) * 3) calc(var(--space-unit) * 3) calc(var(--space-unit) * 8)'
		},
		'.cm-cursor': {
			borderLeftColor: 'var(--color-text)'
		},
		'&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
			backgroundColor: 'var(--color-selection)'
		},
		'.cm-activeLine': {
			backgroundColor: 'transparent'
		},
		'.cm-gutters': {
			display: 'none'
		}
	});

	function buildExtensions(): Extension[] {
		return [
			history(),
			theme,
			placeholder('Start writing…'),
			markdown({ codeLanguages: languages }),
			syntaxHighlighting(mdHighlight),
			keymap.of([...formatKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					editorState.updateContent(update.state.doc.toString());
				}
			}),
			EditorView.lineWrapping
		];
	}

	onMount(() => {
		view = new EditorView({
			state: EditorState.create({ doc: editorState.content, extensions: buildExtensions() }),
			parent: editorContainer
		});

		view.scrollDOM.addEventListener('scroll', handleScroll);
		scrollbars = scroll(view.dom, view.scrollDOM);
	});

	onDestroy(() => {
		scrollbars?.destroy();
		view?.scrollDOM.removeEventListener('scroll', handleScroll);
		view?.destroy();
	});

	function handleScroll() {
		if (isScrolling || !view || !onScroll) return;
		const { scrollTop, scrollHeight, clientHeight } = view.scrollDOM;
		const maxScroll = scrollHeight - clientHeight;
		if (maxScroll > 0) {
			onScroll(scrollTop / maxScroll);
		}
	}

	let lastProjectId: string | null = null;
	$effect(() => {
		const id = editorState.currentProject?.id ?? null;
		if (!view) return;
		if (id === lastProjectId) return;
		lastProjectId = id;
		view.setState(EditorState.create({ doc: editorState.content, extensions: buildExtensions() }));
	});

	$effect(() => {
		if (editorState.focusRequest > 0) view?.focus();
	});

	// Sync scroll position from preview
	$effect(() => {
		if (view && scrollRatio !== undefined) {
			const { scrollHeight, clientHeight } = view.scrollDOM;
			const maxScroll = scrollHeight - clientHeight;
			if (maxScroll > 0) {
				isScrolling = true;
				view.scrollDOM.scrollTop = scrollRatio * maxScroll;
				setTimeout(() => (isScrolling = false), 50);
			}
		}
	});
</script>

<div class="editor" bind:this={editorContainer}></div>

<style>
	.editor {
		height: 100%;
		background: var(--color-editor);
	}

	.editor :global(.cm-editor) {
		height: 100%;
	}

	.editor :global(.cm-focused) {
		outline: none;
	}

	@media (max-width: 720px) {
		.editor :global(.cm-editor .cm-content) {
			padding-inline: calc(var(--space-unit) * 2);
		}
	}
</style>
