<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { editorState } from '$lib/stores/editor.svelte';
	import { EditorView, keymap, placeholder } from '@codemirror/view';
	import { EditorState } from '@codemirror/state';
	import { markdown } from '@codemirror/lang-markdown';
	import { languages } from '@codemirror/language-data';
	import { defaultKeymap, indentWithTab } from '@codemirror/commands';
	import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

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

	onMount(() => {
		const startState = EditorState.create({
			doc: editorState.content,
			extensions: [
				theme,
				placeholder('Start writing markdown...'),
				markdown({ codeLanguages: languages }),
				syntaxHighlighting(defaultHighlightStyle),
				keymap.of([...defaultKeymap, indentWithTab]),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						editorState.updateContent(update.state.doc.toString());
					}
				}),
				EditorView.lineWrapping
			]
		});

		view = new EditorView({
			state: startState,
			parent: editorContainer
		});

		// Listen for scroll events
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

	// Sync external content changes to CodeMirror
	$effect(() => {
		if (view && editorState.content !== view.state.doc.toString()) {
			view.dispatch({
				changes: {
					from: 0,
					to: view.state.doc.length,
					insert: editorState.content
				}
			});
		}
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
		background: var(--color-surface);
	}

	.editor :global(.cm-editor) {
		height: 100%;
	}

	.editor :global(.cm-focused) {
		outline: none;
	}
</style>
