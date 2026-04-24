<script lang="ts">
	import { onMount } from 'svelte';
	import { editorState } from '$lib/stores/editor.svelte';
	import Editor from './Editor.svelte';
	import Preview from './Preview.svelte';

	const STORAGE_KEY = 'md-editor-split-ratio';

	let splitRatio = $state(0.5);
	let isDragging = $state(false);
	let container: HTMLDivElement;

	// Scroll sync state
	let editorScrollRatio = $state<number | undefined>(undefined);
	let previewScrollRatio = $state<number | undefined>(undefined);
	let scrollSource = $state<'editor' | 'preview' | null>(null);

	function handleEditorScroll(ratio: number) {
		if (editorState.viewMode !== 'split' || scrollSource === 'preview') return;
		scrollSource = 'editor';
		previewScrollRatio = ratio;
		setTimeout(() => (scrollSource = null), 100);
	}

	function handlePreviewScroll(ratio: number) {
		if (editorState.viewMode !== 'split' || scrollSource === 'editor') return;
		scrollSource = 'preview';
		editorScrollRatio = ratio;
		setTimeout(() => (scrollSource = null), 100);
	}

	onMount(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			splitRatio = parseFloat(saved);
		}
	});

	function handleMouseDown(e: MouseEvent) {
		if (editorState.viewMode !== 'split') return;
		e.preventDefault();
		isDragging = true;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || !container) return;
		const rect = container.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const newRatio = Math.min(0.8, Math.max(0.2, x / rect.width));
		splitRatio = newRatio;
	}

	function handleMouseUp() {
		if (isDragging) {
			localStorage.setItem(STORAGE_KEY, splitRatio.toString());
		}
		isDragging = false;
	}

	function handleDividerKeydown(e: KeyboardEvent) {
		if (editorState.viewMode !== 'split') return;
		const step = e.shiftKey ? 0.1 : 0.02;
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			splitRatio = Math.max(0.2, splitRatio - step);
			localStorage.setItem(STORAGE_KEY, splitRatio.toString());
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			splitRatio = Math.min(0.8, splitRatio + step);
			localStorage.setItem(STORAGE_KEY, splitRatio.toString());
		}
	}

	const editorWidth = $derived(
		editorState.viewMode === 'preview' ? '0' :
		editorState.viewMode === 'editor' ? '100%' :
		`calc(${splitRatio * 100}% - 0.5px)`
	);

	const previewWidth = $derived(
		editorState.viewMode === 'editor' ? '0' :
		editorState.viewMode === 'preview' ? '100%' :
		`calc(${(1 - splitRatio) * 100}% - 0.5px)`
	);
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<div class="split-pane" class:dragging={isDragging} bind:this={container}>
	<div
		class="pane editor-pane"
		class:hidden={editorState.viewMode === 'preview'}
		style:width={editorWidth}
	>
		<Editor onScroll={handleEditorScroll} scrollRatio={editorScrollRatio} />
	</div>
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="divider"
		class:hidden={editorState.viewMode !== 'split'}
		onmousedown={handleMouseDown}
		onkeydown={handleDividerKeydown}
		role="separator"
		aria-label="Resize panes"
		aria-orientation="vertical"
		aria-valuenow={Math.round(splitRatio * 100)}
		aria-valuemin={20}
		aria-valuemax={80}
		tabindex={editorState.viewMode === 'split' ? 0 : -1}
	></div>
	<div
		class="pane preview-pane"
		class:hidden={editorState.viewMode === 'editor'}
		style:width={previewWidth}
	>
		<Preview onScroll={handlePreviewScroll} scrollRatio={previewScrollRatio} />
	</div>
</div>

<style>
	.split-pane {
		display: flex;
		height: 100%;
	}

	.split-pane.dragging {
		user-select: none;
	}

	.pane {
		height: 100%;
		overflow: hidden;
	}

	.pane.hidden {
		width: 0 !important;
		visibility: hidden;
	}

	.divider {
		width: 1px;
		flex-shrink: 0;
		background: var(--color-border);
		cursor: col-resize;
		position: relative;
		padding: 0;
		border: none;
	}

	.divider:focus-visible {
		outline: none;
	}

	.divider:focus-visible::before {
		background: var(--color-accent);
	}

	.divider::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: -4px;
		right: -4px;
	}

	.divider:hover,
	.split-pane.dragging .divider {
		background: var(--color-accent);
	}

	.divider.hidden {
		display: none;
	}
</style>
