<script lang="ts">
	import { editorState } from '$lib/stores/editor.svelte';
	import { parseMarkdown } from '$lib/utils/markdown';

	interface Props {
		onScroll?: (scrollRatio: number) => void;
		scrollRatio?: number;
	}

	let { onScroll, scrollRatio }: Props = $props();

	let previewEl: HTMLDivElement;
	let isScrolling = false;

	const html = $derived(parseMarkdown(editorState.content));

	function handleScroll() {
		if (isScrolling || !previewEl || !onScroll) return;
		const { scrollTop, scrollHeight, clientHeight } = previewEl;
		const maxScroll = scrollHeight - clientHeight;
		if (maxScroll > 0) {
			onScroll(scrollTop / maxScroll);
		}
	}

	$effect(() => {
		if (previewEl && scrollRatio !== undefined) {
			const { scrollHeight, clientHeight } = previewEl;
			const maxScroll = scrollHeight - clientHeight;
			if (maxScroll > 0) {
				isScrolling = true;
				previewEl.scrollTop = scrollRatio * maxScroll;
				setTimeout(() => (isScrolling = false), 50);
			}
		}
	});
</script>

<div class="preview" bind:this={previewEl} onscroll={handleScroll}>
	<article class="prose">
		{@html html}
	</article>
</div>

<style>
	.preview {
		height: 100%;
		overflow-y: auto;
		background: var(--color-surface);
	}

	.prose {
		max-width: 72ch;
		margin: 0 auto;
		padding: calc(var(--space-unit) * 3);
		font-family: var(--font-sans);
		font-size: 15px;
		line-height: 1.7;
		color: var(--color-text);
	}

	/* Headings */
	.prose :global(h1),
	.prose :global(h2),
	.prose :global(h3),
	.prose :global(h4),
	.prose :global(h5),
	.prose :global(h6) {
		font-weight: 600;
		line-height: 1.3;
		margin-top: 1.5em;
		margin-bottom: 0.5em;
	}

	.prose :global(h1:first-child),
	.prose :global(h2:first-child),
	.prose :global(h3:first-child) {
		margin-top: 0;
	}

	.prose :global(h1) {
		font-size: 2em;
	}
	.prose :global(h2) {
		font-size: 1.5em;
	}
	.prose :global(h3) {
		font-size: 1.25em;
	}
	.prose :global(h4) {
		font-size: 1.1em;
	}

	/* Paragraphs and text */
	.prose :global(p) {
		margin: 1em 0;
	}

	.prose :global(a) {
		color: var(--color-accent);
		text-decoration: none;
	}

	.prose :global(a:hover) {
		text-decoration: underline;
	}

	.prose :global(strong) {
		font-weight: 600;
	}

	.prose :global(em) {
		font-style: italic;
	}

	.prose :global(del) {
		text-decoration: line-through;
		color: var(--color-text-muted);
	}

	/* Lists */
	.prose :global(ul),
	.prose :global(ol) {
		margin: 1em 0;
		padding-left: 1.5em;
	}

	.prose :global(li) {
		margin: 0.25em 0;
	}

	.prose :global(li > ul),
	.prose :global(li > ol) {
		margin: 0.25em 0;
	}

	/* Task lists */
	.prose :global(ul.contains-task-list) {
		list-style: none;
		padding-left: 0;
	}

	.prose :global(li.task-list-item) {
		display: flex;
		align-items: flex-start;
		gap: 0.5em;
	}

	.prose :global(input[type='checkbox']) {
		margin-top: 0.35em;
		accent-color: var(--color-accent);
	}

	/* Blockquotes */
	.prose :global(blockquote) {
		margin: 1em 0;
		padding: 0.5em 1em;
		border-left: 3px solid var(--color-border);
		color: var(--color-text-muted);
		font-style: italic;
	}

	.prose :global(blockquote p) {
		margin: 0.5em 0;
	}

	/* Code */
	.prose :global(code) {
		font-family: var(--font-mono);
		font-size: 0.9em;
		background: var(--color-bg);
		padding: 0.15em 0.4em;
		border-radius: var(--radius-sm);
	}

	.prose :global(pre) {
		margin: 1em 0;
		padding: 1em;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow-x: auto;
	}

	.prose :global(pre code) {
		background: none;
		padding: 0;
		font-size: 13px;
		color: var(--color-text);
	}

	/* Tables */
	.prose :global(table) {
		width: 100%;
		margin: 1em 0;
		border-collapse: collapse;
		font-size: 0.95em;
	}

	.prose :global(th),
	.prose :global(td) {
		padding: 0.6em 1em;
		text-align: left;
		border: 1px solid var(--color-border);
	}

	.prose :global(th) {
		font-weight: 600;
		background: var(--color-bg);
	}

	.prose :global(tr:nth-child(even)) {
		background: var(--color-bg);
	}

	/* Horizontal rule */
	.prose :global(hr) {
		margin: 2em 0;
		border: none;
		border-top: 1px solid var(--color-border);
	}

	/* Images */
	.prose :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius);
	}

	/* Syntax highlighting (Light theme) */
	.prose :global(.hljs-keyword) {
		color: #d73a49;
	}
	.prose :global(.hljs-string) {
		color: #032f62;
	}
	.prose :global(.hljs-number) {
		color: #005cc5;
	}
	.prose :global(.hljs-comment) {
		color: #6a737d;
	}
	.prose :global(.hljs-function),
	.prose :global(.hljs-title) {
		color: #6f42c1;
	}
	.prose :global(.hljs-class) {
		color: #22863a;
	}
	.prose :global(.hljs-variable) {
		color: #e36209;
	}
	.prose :global(.hljs-operator),
	.prose :global(.hljs-punctuation) {
		color: var(--color-text);
	}
	.prose :global(.hljs-property),
	.prose :global(.hljs-attr) {
		color: #005cc5;
	}
	.prose :global(.hljs-tag),
	.prose :global(.hljs-name) {
		color: #22863a;
	}
	.prose :global(.hljs-attribute) {
		color: #6f42c1;
	}
	.prose :global(.hljs-built_in) {
		color: #005cc5;
	}
	.prose :global(.hljs-literal) {
		color: #005cc5;
	}
	.prose :global(.hljs-params) {
		color: var(--color-text);
	}
	.prose :global(.hljs-symbol) {
		color: #005cc5;
	}
	.prose :global(.hljs-meta) {
		color: #6a737d;
	}
	.prose :global(.hljs-section) {
		color: #005cc5;
		font-weight: 600;
	}
</style>
