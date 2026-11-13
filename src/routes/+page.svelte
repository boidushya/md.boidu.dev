<script lang="ts">
	import { onMount } from 'svelte';
	import { editorState } from '$lib/stores/editor.svelte';
	import { keysOf, matches, shortcuts, shortcutSections, type ShortcutId } from '$lib/shortcuts';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import ProjectList from '$lib/components/ProjectList.svelte';
	import SplitPane from '$lib/components/SplitPane.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import { toast } from 'svelte-sonner';

	const IMPORTABLE = /\.(md|markdown|txt)$/i;

	let showHelpDialog = $state(false);
	let dragDepth = $state(0);

	onMount(() => {
		editorState.init();
	});

	function handleNewProject() {
		if (editorState.isNarrow) editorState.sidebarOpen = false;
		editorState.newProject();
	}

	const actions: Partial<Record<ShortcutId, () => void>> = {
		editorView: () => editorState.setViewMode('editor'),
		splitView: () => editorState.setViewMode('split'),
		previewView: () => editorState.setViewMode('preview'),
		sidebar: () => editorState.toggleSidebar(),
		newProject: handleNewProject,
		prevProject: () => editorState.openAdjacentProject(-1),
		nextProject: () => editorState.openAdjacentProject(1),
		rename: () => {
			if (editorState.currentProject && !editorState.isNarrow) editorState.renaming = true;
		},
		save: () => editorState.save(),
		share: () => editorState.share(),
		help: () => (showHelpDialog = !showHelpDialog)
	};

	function handleKeydown(e: KeyboardEvent) {
		for (const [id, run] of Object.entries(actions) as [ShortcutId, () => void][]) {
			if (matches(e, id)) {
				e.preventDefault();
				e.stopPropagation();
				run();
				return;
			}
		}
		if (e.key === 'Escape' && editorState.isNarrow && editorState.sidebarOpen) {
			editorState.sidebarOpen = false;
		}
	}

	function hasFiles(e: DragEvent) {
		return e.dataTransfer?.types.includes('Files') ?? false;
	}

	function handleDragEnter(e: DragEvent) {
		if (hasFiles(e)) dragDepth++;
	}

	function handleDragLeave(e: DragEvent) {
		if (hasFiles(e)) dragDepth = Math.max(0, dragDepth - 1);
	}

	function handleDragOver(e: DragEvent) {
		if (hasFiles(e)) e.preventDefault();
	}

	async function handleDrop(e: DragEvent) {
		if (!hasFiles(e)) return;
		e.preventDefault();
		dragDepth = 0;
		const files = [...(e.dataTransfer?.files ?? [])];
		const importable = files.filter((f) => IMPORTABLE.test(f.name));
		if (importable.length === 0) {
			toast.error('Only .md, .markdown and .txt files can be opened');
			return;
		}
		for (const file of importable) await editorState.importFile(file);
		toast.success(importable.length === 1 ? `Opened ${importable[0].name}` : `Opened ${importable.length} files`);
	}
</script>

<svelte:window
	onkeydowncapture={handleKeydown}
	ondragenter={handleDragEnter}
	ondragleave={handleDragLeave}
	ondragover={handleDragOver}
	ondrop={handleDrop}
/>

<div class="app">
	<ProjectList onNewProject={handleNewProject} />

	<main class="main">
		<Toolbar onNewProject={handleNewProject} onShowHelp={() => (showHelpDialog = true)} />
		<div class="content">
			<SplitPane />
		</div>
	</main>
</div>

{#if dragDepth > 0}
	<div class="drop-overlay" aria-hidden="true">
		<div class="drop-card">Drop a Markdown file to open it</div>
	</div>
{/if}

<Dialog bind:open={showHelpDialog} title="Keyboard shortcuts" width={560}>
	<div class="sections">
		{#each shortcutSections as section (section.title)}
			<section>
				<h4>{section.title}</h4>
				<dl class="shortcuts">
					{#each section.ids as id (id)}
						<div class="shortcut">
							<dt>{shortcuts[id].label}</dt>
							<dd>
								{#each keysOf(id) as key (key)}<kbd>{key}</kbd>{/each}
							</dd>
						</div>
					{/each}
				</dl>
			</section>
		{/each}
	</div>
	<p class="hint">Drop a .md file anywhere to open it. Press <kbd>Esc</kbd> to close.</p>
</Dialog>

<style>
	.app {
		display: flex;
		height: 100dvh;
		overflow: hidden;
	}

	.main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.content {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.sections {
		columns: 2 220px;
		column-gap: 28px;
	}

	section {
		break-inside: avoid;
		padding-bottom: 20px;
	}

	h4 {
		margin-bottom: 10px;
		font-size: 12px;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.shortcuts {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.shortcut {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	dt {
		font-size: 14px;
		color: var(--color-text-muted);
	}

	dd {
		display: flex;
		gap: 4px;
	}

	kbd {
		display: inline-grid;
		place-items: center;
		min-width: 24px;
		height: 24px;
		padding: 0 6px;
		font-family: var(--font-sans);
		font-size: 12px;
		font-weight: 500;
		color: var(--color-text);
		background: var(--color-bg);
		box-shadow:
			var(--shadow-border),
			0 1px 0 var(--color-border);
		border-radius: 6px;
	}

	.hint {
		margin-top: 16px;
		padding-top: 14px;
		box-shadow: 0 -1px 0 var(--color-border);
		font-size: 13px;
		color: var(--color-text-muted);
	}

	.drop-overlay {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: grid;
		place-items: center;
		padding: 16px;
		background: color-mix(in oklab, var(--color-bg) 70%, transparent);
		pointer-events: none;
		animation: fade-in var(--dur) ease both;
	}

	.drop-card {
		padding: 28px 36px;
		border: 1.5px dashed color-mix(in oklab, var(--color-accent) 60%, transparent);
		border-radius: 16px;
		background: var(--color-surface);
		box-shadow: var(--shadow-pop);
		font-weight: 500;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}
</style>
