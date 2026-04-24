<script lang="ts">
	import { editorState, type ViewMode } from '$lib/stores/editor.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import {
		SidebarMinimalistic,
		AddCircle,
		QuestionCircle,
		Share,
		Moon,
		Sun
	} from '@solar-icons/svelte/Linear';

	interface Props {
		onNewProject: () => void;
		onShowHelp: () => void;
	}

	let { onNewProject, onShowHelp }: Props = $props();

	let isEditingName = $state(false);
	let editedName = $state('');
	let nameInput = $state<HTMLInputElement>();

	const views: { mode: ViewMode; label: string }[] = [
		{ mode: 'editor', label: 'Editor' },
		{ mode: 'split', label: 'Split' },
		{ mode: 'preview', label: 'Preview' }
	];

	function startEditing() {
		if (!editorState.currentProject) return;
		editedName = editorState.currentProject.name;
		isEditingName = true;
		// Focus after DOM update
		setTimeout(() => nameInput?.select(), 0);
	}

	function saveNameEdit() {
		if (editedName.trim() && editorState.currentProject) {
			editorState.renameProject(editedName.trim());
		}
		isEditingName = false;
	}

	function handleNameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			saveNameEdit();
		} else if (e.key === 'Escape') {
			isEditingName = false;
		}
	}
</script>

<header class="toolbar">
	<div class="left">
		<button class="sidebar-toggle" onclick={() => editorState.toggleSidebar()} title="Toggle sidebar (Cmd+B)">
			<SidebarMinimalistic size={18} />
		</button>

		{#if editorState.currentProject}
			<div class="project-name-container">
				<span class="project-name-measure">{isEditingName ? editedName : editorState.currentProject.name}</span>
				{#if isEditingName}
					<input
						bind:this={nameInput}
						bind:value={editedName}
						class="project-name-input"
						onblur={saveNameEdit}
						onkeydown={handleNameKeydown}
					/>
				{:else}
					<span
						class="project-name"
						ondblclick={startEditing}
						onkeydown={(e) => (e.key === 'Enter' || e.key === 'F2') && startEditing()}
						role="button"
						tabindex="0"
						title="Double-click to rename"
					>{editorState.currentProject.name}</span>
				{/if}
			</div>
		{/if}
	</div>

	<div class="center">
		<div class="view-toggle">
			{#each views as { mode, label }}
				<button
					class="view-btn"
					class:active={editorState.viewMode === mode}
					onclick={() => editorState.setViewMode(mode)}
				>
					{label}
				</button>
			{/each}
		</div>
	</div>

	<div class="right">
		{#if editorState.saveStatus !== 'saved'}
			<span class="save-status">
				{editorState.saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
			</span>
		{/if}

		<button
			class="action-btn"
			onclick={() => editorState.share()}
			disabled={!editorState.content.trim() || editorState.sharing}
			title="Share snapshot (Cmd+Shift+S)"
		>
			<Share size={18} />
		</button>

		<button class="action-btn" onclick={onNewProject} title="New Project (Cmd+N)">
			<AddCircle size={18} />
		</button>

		<button
			class="action-btn"
			onclick={() => theme.toggle()}
			title={theme.current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
		>
			{#if theme.current === 'dark'}
				<Sun size={18} />
			{:else}
				<Moon size={18} />
			{/if}
		</button>

		<button class="action-btn" onclick={onShowHelp} title="Help (Cmd+/)">
			<QuestionCircle size={18} />
		</button>
	</div>
</header>

<style>
	.toolbar {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		height: 48px;
		padding: 0 calc(var(--space-unit) * 2);
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
	}

	.left,
	.right {
		display: flex;
		align-items: center;
		gap: calc(var(--space-unit) * 1.5);
		min-width: 0;
	}

	.left {
		justify-self: start;
	}

	.right {
		justify-self: end;
	}

	.center {
		display: flex;
		justify-content: center;
	}

	.sidebar-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		transition: all var(--transition);
	}

	.sidebar-toggle:hover {
		background: var(--color-bg);
		color: var(--color-text);
	}

	.project-name-container {
		position: relative;
	}

	.project-name-measure {
		font-weight: 500;
		font-size: 14px;
		visibility: hidden;
		white-space: pre;
	}

	.project-name,
	.project-name-input {
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		font-weight: 500;
		font-size: 14px;
		color: var(--color-text);
		padding: 0;
		margin: 0;
		border: none;
		background: transparent;
		font-family: inherit;
	}

	.project-name {
		cursor: text;
		white-space: pre;
	}

	.project-name-input {
		background: var(--color-bg);
		padding: 0 8px;
		margin-left: -8px;
		border-radius: var(--radius-sm);
		width: calc(100% + 16px);
	}

	.view-toggle {
		display: flex;
		background: var(--color-bg);
		border-radius: var(--radius);
		padding: 3px;
	}

	.view-btn {
		padding: 6px 14px;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text-muted);
		border-radius: var(--radius-sm);
		transition: all var(--transition);
	}

	.view-btn:hover {
		color: var(--color-text);
	}

	.view-btn.active {
		background: var(--color-surface);
		color: var(--color-text);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.save-status {
		font-size: 12px;
		color: var(--color-text-muted);
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		transition: all var(--transition);
	}

	.action-btn:hover {
		background: var(--color-bg);
		color: var(--color-text);
	}

	.action-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.action-btn:disabled:hover {
		background: transparent;
		color: var(--color-text-muted);
	}
</style>
