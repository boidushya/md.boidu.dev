<script lang="ts">
	import { onMount } from 'svelte';
	import { editorState, type ViewMode } from '$lib/stores/editor.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import ProjectList from '$lib/components/ProjectList.svelte';
	import SplitPane from '$lib/components/SplitPane.svelte';

	let showNewProjectDialog = $state(false);
	let showHelpDialog = $state(false);
	let newProjectName = $state('');
	let newProjectInput = $state<HTMLInputElement>();

	$effect(() => {
		if (showNewProjectDialog && newProjectInput) {
			newProjectInput.focus();
		}
	});

	const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
	const modKey = isMac ? '⌘' : 'Ctrl';

	onMount(() => {
		editorState.init();
	});

	function handleNewProject() {
		showNewProjectDialog = true;
		newProjectName = '';
	}

	async function createNewProject() {
		if (newProjectName.trim()) {
			await editorState.newProject(newProjectName.trim());
			showNewProjectDialog = false;
			newProjectName = '';
		}
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
		} else if (e.key === 'Escape') {
			if (showHelpDialog) showHelpDialog = false;
			else if (showNewProjectDialog) showNewProjectDialog = false;
		}
	}

	function handleDialogKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			createNewProject();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app">
	<ProjectList onNewProject={handleNewProject} />

	<main class="main">
		<Toolbar onNewProject={handleNewProject} onShowHelp={() => (showHelpDialog = true)} />
		<div class="content">
			<SplitPane />
		</div>
	</main>
</div>

{#if showNewProjectDialog}
	<div class="dialog-root">
		<button
			type="button"
			class="dialog-backdrop"
			onclick={() => (showNewProjectDialog = false)}
			aria-label="Close dialog"
		></button>
		<div class="dialog" role="dialog" aria-modal="true" tabindex="-1">
			<h3>New Project</h3>
			<input
				type="text"
				bind:this={newProjectInput}
				bind:value={newProjectName}
				placeholder="Project name"
				onkeydown={handleDialogKeydown}
			/>
			<div class="dialog-actions">
				<button class="btn-secondary" onclick={() => (showNewProjectDialog = false)}>Cancel</button>
				<button class="btn-primary" onclick={createNewProject}>Create</button>
			</div>
		</div>
	</div>
{/if}

{#if showHelpDialog}
	<div class="dialog-root">
		<button
			type="button"
			class="dialog-backdrop"
			onclick={() => (showHelpDialog = false)}
			aria-label="Close dialog"
		></button>
		<div class="dialog help-dialog" role="dialog" aria-modal="true" tabindex="-1">
			<h3>Keyboard Shortcuts</h3>
			<div class="shortcuts">
				<div class="shortcut">
					<span class="shortcut-keys"><kbd>{modKey}</kbd><kbd>1</kbd></span>
					<span class="shortcut-desc">Editor view</span>
				</div>
				<div class="shortcut">
					<span class="shortcut-keys"><kbd>{modKey}</kbd><kbd>2</kbd></span>
					<span class="shortcut-desc">Split view</span>
				</div>
				<div class="shortcut">
					<span class="shortcut-keys"><kbd>{modKey}</kbd><kbd>3</kbd></span>
					<span class="shortcut-desc">Preview view</span>
				</div>
				<div class="shortcut">
					<span class="shortcut-keys"><kbd>{modKey}</kbd><kbd>B</kbd></span>
					<span class="shortcut-desc">Toggle sidebar</span>
				</div>
				<div class="shortcut">
					<span class="shortcut-keys"><kbd>{modKey}</kbd><kbd>N</kbd></span>
					<span class="shortcut-desc">New project</span>
				</div>
				<div class="shortcut">
					<span class="shortcut-keys"><kbd>{modKey}</kbd><kbd>⇧</kbd><kbd>S</kbd></span>
					<span class="shortcut-desc">Share snapshot</span>
				</div>
				<div class="shortcut">
					<span class="shortcut-keys"><kbd>{modKey}</kbd><kbd>/</kbd></span>
					<span class="shortcut-desc">Show help</span>
				</div>
				<div class="shortcut">
					<span class="shortcut-keys"><kbd>Esc</kbd></span>
					<span class="shortcut-desc">Close dialog</span>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.app {
		display: flex;
		height: 100vh;
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
		overflow: hidden;
	}

	/* Dialog */
	.dialog-root {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.dialog-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		border: none;
		padding: 0;
		cursor: default;
	}

	.dialog {
		position: relative;
		background: var(--color-surface);
		border-radius: var(--radius);
		padding: calc(var(--space-unit) * 3);
		width: 100%;
		max-width: 360px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
	}

	.dialog h3 {
		margin-bottom: calc(var(--space-unit) * 2);
		font-size: 16px;
		font-weight: 600;
	}

	.dialog input {
		width: 100%;
		padding: calc(var(--space-unit) * 1.5);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 14px;
		transition: border-color var(--transition);
	}

	.dialog input:focus {
		border-color: var(--color-text);
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: calc(var(--space-unit) * 1);
		margin-top: calc(var(--space-unit) * 3);
	}

	.btn-secondary,
	.btn-primary {
		padding: calc(var(--space-unit) * 1) calc(var(--space-unit) * 2);
		border-radius: var(--radius-sm);
		font-size: 14px;
		font-weight: 500;
		transition: all var(--transition);
	}

	.btn-secondary {
		color: var(--color-text-muted);
	}

	.btn-secondary:hover {
		background: var(--color-bg);
		color: var(--color-text);
	}

	.btn-primary {
		background: var(--color-text);
		color: var(--color-surface);
	}

	.btn-primary:hover {
		background: var(--color-text-muted);
	}

	/* Help dialog */
	.help-dialog {
		max-width: 320px;
	}

	.shortcuts {
		display: flex;
		flex-direction: column;
		gap: calc(var(--space-unit) * 1.5);
	}

	.shortcut {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: calc(var(--space-unit) * 2);
	}

	.shortcut-keys {
		display: flex;
		gap: 4px;
	}

	.shortcut-keys kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 24px;
		height: 24px;
		padding: 0 6px;
		font-family: var(--font-sans);
		font-size: 12px;
		font-weight: 500;
		color: var(--color-text);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.shortcut-desc {
		font-size: 14px;
		color: var(--color-text-muted);
	}
</style>
