<script lang="ts">
	import { onMount } from 'svelte';
	import { editorState } from '$lib/stores/editor.svelte';
	import { modKey } from '$lib/utils/platform';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import ProjectList from '$lib/components/ProjectList.svelte';
	import SplitPane from '$lib/components/SplitPane.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import { toast } from 'svelte-sonner';

	const IMPORTABLE = /\.(md|markdown|txt)$/i;

	const shortcuts: { keys: string[]; label: string }[] = [
		{ keys: [modKey, '1'], label: 'Editor view' },
		{ keys: [modKey, '2'], label: 'Split view' },
		{ keys: [modKey, '3'], label: 'Preview view' },
		{ keys: [modKey, 'B'], label: 'Toggle sidebar' },
		{ keys: [modKey, 'N'], label: 'New project' },
		{ keys: [modKey, 'S'], label: 'Save now' },
		{ keys: [modKey, '⇧', 'S'], label: 'Share snapshot' },
		{ keys: [modKey, '/'], label: 'Shortcuts' }
	];

	let showNewProjectDialog = $state(false);
	let showHelpDialog = $state(false);
	let newProjectName = $state('');
	let dragDepth = $state(0);

	onMount(() => {
		editorState.init();
	});

	function handleNewProject() {
		newProjectName = '';
		showNewProjectDialog = true;
	}

	async function createNewProject(e: SubmitEvent) {
		e.preventDefault();
		await editorState.newProject(newProjectName.trim() || 'Untitled');
		showNewProjectDialog = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		const isMod = e.metaKey || e.ctrlKey;

		if (isMod && e.key === '1') {
			e.preventDefault();
			editorState.setViewMode('editor');
		} else if (isMod && e.key === '2') {
			e.preventDefault();
			editorState.setViewMode('split');
		} else if (isMod && e.key === '3') {
			e.preventDefault();
			editorState.setViewMode('preview');
		} else if (isMod && e.shiftKey && (e.key === 'S' || e.key === 's')) {
			e.preventDefault();
			editorState.share();
		} else if (isMod && e.key === 's') {
			e.preventDefault();
			editorState.save();
		} else if (isMod && e.key === 'n') {
			e.preventDefault();
			handleNewProject();
		} else if (isMod && e.key === 'b') {
			e.preventDefault();
			editorState.toggleSidebar();
		} else if (isMod && e.key === '/') {
			e.preventDefault();
			showHelpDialog = !showHelpDialog;
		} else if (e.key === 'Escape' && editorState.isNarrow && editorState.sidebarOpen) {
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
	onkeydown={handleKeydown}
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

<Dialog bind:open={showNewProjectDialog} title="New project">
	<form onsubmit={createNewProject}>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			type="text"
			bind:value={newProjectName}
			placeholder="Untitled"
			aria-label="Project name"
			autofocus
		/>
		<div class="dialog-actions">
			<button type="button" class="btn" onclick={() => (showNewProjectDialog = false)}>Cancel</button>
			<button type="submit" class="btn primary">Create</button>
		</div>
	</form>
</Dialog>

<Dialog bind:open={showHelpDialog} title="Keyboard shortcuts" width={320}>
	<dl class="shortcuts">
		{#each shortcuts as { keys, label } (label)}
			<div class="shortcut">
				<dt>{label}</dt>
				<dd>
					{#each keys as key (key)}<kbd>{key}</kbd>{/each}
				</dd>
			</div>
		{/each}
		<div class="shortcut">
			<dt>Close dialog</dt>
			<dd><kbd>Esc</kbd></dd>
		</div>
	</dl>
	<p class="hint">Drop a .md file anywhere to open it.</p>
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

	input {
		width: 100%;
		height: 38px;
		padding: 0 12px;
		border: 1px solid var(--color-border);
		border-radius: 10px;
		font-size: 14px;
		background: var(--color-bg);
		transition:
			border-color var(--dur-fast) ease,
			box-shadow var(--dur-fast) ease;
	}

	input:focus {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-accent) 20%, transparent);
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-unit);
		margin-top: 20px;
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
