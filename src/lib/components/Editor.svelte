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

	const mdHighlight = HighlightStyle.define([
		{ tag: t.heading, color: 'var(--cm-heading)', fontWeight: '600' },
		{ tag: t.strong, fontWeight: '700' },
		{ tag: t.emphasis, fontStyle: 'italic' },
		{ tag: t.strikethrough, textDecoration: 'line-through' },
		{ tag: t.link, color: 'var(--cm-link)' },
		{ tag: t.url, color: 'var(--cm-link)', textDecoration: 'underline' },
		{ tag: t.monospace, color: 'var(--cm-code)' },
		{ tag: t.quote, color: 'var(--color-text-muted)', fontStyle: 'italic' },
		{ tag: t.meta, color: 'var(--cm-meta)' },
		{ tag: t.processingInstruction, color: 'var(--cm-separator)' },
		{ tag: t.contentSeparator, color: 'var(--cm-separator)' },
		{ tag: t.list, color: 'var(--cm-list)' }
	]);

	interface Props {
		onScroll?: (scrollRatio: number) => void;
		scrollRatio?: number;
	}

	let { onScroll, scrollRatio }: Props = $props();

	let editorContainer: HTMLDivElement;
	let view: EditorView;
	let isScrolling = false;

	const theme = EditorView.theme({
		'&': {
			height: '100%',
			fontSize: '14px'
		},
		'.cm-scroller': {
			fontFamily: 'var(--font-mono)',
			lineHeight: '1.7',
			padding: 'calc(var(--space-unit) * 3)'
		},
		'.cm-content': {
			caretColor: 'var(--color-text)'
		},
		'.cm-cursor': {
			borderLeftColor: 'var(--color-text)'
		},
		'&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
			backgroundColor: 'rgba(59, 130, 246, 0.2)'
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
			placeholder('Start writing markdown...'),
			markdown({ codeLanguages: languages }),
			syntaxHighlighting(mdHighlight),
			keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
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
	});

	onDestroy(() => {
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
</style>
