<script lang="ts">
	import { editorState, type ViewMode } from '$lib/stores/editor.svelte';
	import { textStats } from '$lib/utils/stats';
	import { modKey } from '$lib/utils/platform';
	import ThemeToggle from './ThemeToggle.svelte';
	import IconLayoutSidebar from '@tabler/icons-svelte-runes/icons/layout-sidebar';
	import IconPlus from '@tabler/icons-svelte-runes/icons/plus';
	import IconKeyboard from '@tabler/icons-svelte-runes/icons/keyboard';
	import IconShare2 from '@tabler/icons-svelte-runes/icons/share-2';

	interface Props {
		onNewProject: () => void;
		onShowHelp: () => void;
	}

	let { onNewProject, onShowHelp }: Props = $props();

	let isEditingName = $state(false);
	let editedName = $state('');
	let nameInput = $state<HTMLInputElement>();
	let animatePill = $state(false);

	const allViews: { mode: ViewMode; label: string }[] = [
		{ mode: 'editor', label: 'Editor' },
		{ mode: 'split', label: 'Split' },
		{ mode: 'preview', label: 'Preview' }
	];

	const views = $derived(
		editorState.isNarrow ? allViews.filter((v) => v.mode !== 'split') : allViews
	);
	const activeIndex = $derived(views.findIndex((v) => v.mode === editorState.effectiveViewMode));
	const stats = $derived(textStats(editorState.content));
	const saveLabel = $derived(
		editorState.saveStatus === 'saving' ? 'Saving…' : editorState.saveStatus === 'unsaved' ? 'Edited' : ''
	);

	function selectView(mode: ViewMode) {
		animatePill = true;
		editorState.setViewMode(mode);
	}

	function startEditing() {
		if (!editorState.currentProject) return;
		editedName = editorState.currentProject.name;
		isEditingName = true;
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

<svelte:window onkeydown={() => (animatePill = false)} />

<header class="toolbar">
	<div class="left">
		<button
			class="icon-btn sidebar-toggle"
			class:hidden={editorState.sidebarOpen && !editorState.isNarrow}
			onclick={() => editorState.toggleSidebar()}
			title="Toggle sidebar ({modKey}B)"
			aria-label="Toggle sidebar"
			aria-expanded={editorState.sidebarOpen}
		>
			<IconLayoutSidebar size={18} />
		</button>

		{#if editorState.currentProject}
			<div class="project-name-container">
				<span class="project-name-measure">{isEditingName ? editedName : editorState.currentProject.name}</span>
				{#if isEditingName}
					<input
						bind:this={nameInput}
						bind:value={editedName}
						class="project-name-input"
						aria-label="Project name"
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
		<div
			class="view-toggle"
			class:animate={animatePill}
			role="group"
			aria-label="View"
			style:--count={views.length}
			style:--index={activeIndex}
		>
			<span class="pill" aria-hidden="true"></span>
			{#each views as { mode, label } (mode)}
				<button
					class="view-btn"
					class:active={editorState.effectiveViewMode === mode}
					aria-pressed={editorState.effectiveViewMode === mode}
					onclick={() => selectView(mode)}
				>
					{label}
				</button>
			{/each}
		</div>
	</div>

	<div class="right">
		<span class="meta">
			<span class="save-status" class:visible={saveLabel !== ''} aria-live="polite">{saveLabel}</span>
			{#if stats.words > 0}
				<span class="word-count" title="{stats.minutes} min read">
					{stats.words.toLocaleString()} {stats.words === 1 ? 'word' : 'words'}
				</span>
			{/if}
		</span>

		<button
			class="icon-btn"
			onclick={() => editorState.share()}
			disabled={!editorState.content.trim() || editorState.sharing}
			title="Share snapshot ({modKey}⇧S)"
			aria-label="Share snapshot"
		>
			<IconShare2 size={18} />
		</button>

		<button class="icon-btn" onclick={onNewProject} title="New project ({modKey}N)" aria-label="New project">
			<IconPlus size={18} />
		</button>

		<ThemeToggle />

		<button class="icon-btn help" onclick={onShowHelp} title="Shortcuts ({modKey}/)" aria-label="Keyboard shortcuts">
			<IconKeyboard size={18} />
		</button>
	</div>
</header>

<style>
	.toolbar {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: calc(var(--space-unit) * 1.5);
		height: 48px;
		padding: 0 calc(var(--space-unit) * 1.5);
		background: var(--color-surface);
		box-shadow: 0 1px 0 var(--color-border);
	}

	.left,
	.right {
		display: flex;
		align-items: center;
		gap: 4px;
		min-width: 0;
	}

	.left {
		justify-self: start;
	}

	.right {
		justify-self: end;
	}

	.sidebar-toggle.hidden {
		display: none;
	}

	.project-name-container {
		position: relative;
		min-width: 0;
		margin-left: 6px;
		overflow: hidden;
	}

	.project-name-measure {
		display: block;
		font-weight: 500;
		font-size: 14px;
		visibility: hidden;
		white-space: pre;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.project-name,
	.project-name-input {
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		max-width: 100%;
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
		overflow: hidden;
		text-overflow: ellipsis;
		border-radius: 4px;
	}

	.project-name-input {
		background: var(--color-bg);
		padding: 0 6px;
		margin-left: -6px;
		border-radius: 6px;
		width: calc(100% + 12px);
		box-shadow: var(--shadow-border);
	}

	.center {
		display: flex;
		justify-content: center;
	}

	.view-toggle {
		position: relative;
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		padding: 3px;
		background: var(--color-bg);
		border-radius: 11px;
		box-shadow: inset 0 0 0 1px var(--color-border);
	}

	.pill {
		position: absolute;
		top: 3px;
		bottom: 3px;
		left: 3px;
		width: calc((100% - 6px) / var(--count));
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		box-shadow: var(--shadow-raised);
		transform: translateX(calc(var(--index) * 100%));
	}

	.view-toggle.animate .pill {
		transition: transform var(--dur) var(--ease-out);
	}

	.view-btn {
		position: relative;
		height: 28px;
		padding: 0 14px;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text-muted);
		border-radius: var(--radius-sm);
		transition:
			color var(--dur-fast) ease,
			scale var(--dur-fast) ease-out;
	}

	.view-btn.active {
		color: var(--color-text);
	}

	@media (hover: hover) {
		.view-btn:hover {
			color: var(--color-text);
		}
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-right: 6px;
		font-size: 12px;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.save-status {
		opacity: 0;
		transition: opacity var(--dur) ease;
	}

	.save-status.visible {
		opacity: 1;
	}

	@media (max-width: 720px) {
		.toolbar {
			grid-template-columns: auto 1fr auto;
			padding: 0 var(--space-unit);
		}

		.project-name-container,
		.meta,
		.help {
			display: none;
		}

		.center {
			justify-content: flex-start;
		}

		.view-btn {
			padding: 0 10px;
		}
	}
</style>
