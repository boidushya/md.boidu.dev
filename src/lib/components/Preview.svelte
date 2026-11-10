<script lang="ts">
	import { editorState } from '$lib/stores/editor.svelte';
	import { parseMarkdown } from '$lib/utils/markdown';
	import { scroll } from '$lib/actions/scroll';
	import { onMount } from 'svelte';

	interface Props {
		onScroll?: (scrollRatio: number) => void;
		scrollRatio?: number;
		content?: string;
	}

	let { onScroll, scrollRatio, content }: Props = $props();

	let hostEl: HTMLDivElement;
	let previewEl: HTMLDivElement;
	let isScrolling = false;

	const sourceContent = $derived(content ?? editorState.content);
	const html = $derived(parseMarkdown(sourceContent));

	function handleScroll() {
		if (isScrolling || !previewEl || !onScroll) return;
		const { scrollTop, scrollHeight, clientHeight } = previewEl;
		const maxScroll = scrollHeight - clientHeight;
		if (maxScroll > 0) {
			onScroll(scrollTop / maxScroll);
		}
	}

	onMount(() => scroll(hostEl, previewEl).destroy);

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

<div class="preview-host" bind:this={hostEl}>
	<div class="preview" bind:this={previewEl} onscroll={handleScroll}>
		<article class="prose">
			{@html html}
		</article>
	</div>
</div>

<style>
	.preview-host {
		height: 100%;
		background: var(--color-editor);
	}

	.preview {
		height: 100%;
		overflow-y: auto;
	}

	.prose {
		max-width: 72ch;
		margin: 0 auto;
		padding: calc(var(--space-unit) * 4) calc(var(--space-unit) * 3) calc(var(--space-unit) * 8);
		text-wrap: pretty;
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
		text-decoration: underline;
		text-decoration-color: color-mix(in oklab, var(--color-accent) 35%, transparent);
		text-underline-offset: 0.2em;
		transition: text-decoration-color var(--dur-fast) ease;
	}

	@media (hover: hover) {
		.prose :global(a:hover) {
			text-decoration-color: currentColor;
		}
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
	.prose :global(li:has(> input[type='checkbox'])) {
		list-style: none;
		margin-left: -1.5em;
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
		border-left: 2px solid var(--color-border);
		color: var(--color-text-muted);
	}

	.prose :global(blockquote p) {
		margin: 0.5em 0;
	}

	/* Code */
	.prose :global(code) {
		font-family: var(--font-mono);
		font-size: 0.9em;
		background: var(--color-bg);
		box-shadow: var(--shadow-border);
		padding: 0.1em 0.35em;
		border-radius: 5px;
	}

	.prose :global(pre) {
		margin: 1em 0;
		padding: 1em 1.15em;
		background: var(--color-bg);
		box-shadow: var(--shadow-border);
		border-radius: var(--radius);
		overflow-x: auto;
	}

	.prose :global(pre code) {
		background: none;
		box-shadow: none;
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
		font-variant-numeric: tabular-nums;
	}

	.prose :global(th),
	.prose :global(td) {
		padding: 0.6em 1em;
		border: 1px solid var(--color-border);
	}

	.prose :global(th:not([align])) {
		text-align: start;
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
		outline: 1px solid oklch(0 0 0 / 0.1);
		outline-offset: -1px;
	}

	:global([data-theme='dark']) .prose :global(img) {
		outline-color: oklch(1 0 0 / 0.1);
	}

	.prose :global(.hljs-keyword),
	.prose :global(.hljs-selector-tag),
	.prose :global(.hljs-literal),
	.prose :global(.hljs-built_in),
	.prose :global(.hljs-number),
	.prose :global(.hljs-symbol),
	.prose :global(.hljs-tag),
	.prose :global(.hljs-name),
	.prose :global(.hljs-section),
	.prose :global(.hljs-type) {
		color: var(--hl-keyword);
	}
	.prose :global(.hljs-string),
	.prose :global(.hljs-regexp),
	.prose :global(.hljs-addition) {
		color: var(--hl-string);
	}
	.prose :global(.hljs-comment),
	.prose :global(.hljs-quote) {
		color: var(--hl-comment);
		font-style: italic;
	}
	.prose :global(.hljs-title),
	.prose :global(.hljs-title.function_) {
		font-weight: 500;
	}
	.prose :global(.hljs-meta),
	.prose :global(.hljs-punctuation),
	.prose :global(.hljs-operator),
	.prose :global(.hljs-deletion) {
		color: var(--hl-muted);
	}

	@media print {
		.preview-host,
		.preview {
			height: auto;
			overflow: visible;
			background: none;
		}

		.prose {
			max-width: none;
			padding: 0;
		}
	}
</style>
