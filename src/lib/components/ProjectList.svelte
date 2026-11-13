<script lang="ts">
	import { editorState } from '$lib/stores/editor.svelte';
	import { copyFailed, copyText } from '$lib/share/clipboard';
	import { scroll } from '$lib/actions/scroll';
	import IconPlus from '@tabler/icons-svelte-runes/icons/plus';
	import IconTrash from '@tabler/icons-svelte-runes/icons/trash';
	import IconChevronDown from '@tabler/icons-svelte-runes/icons/chevron-down';
	import IconCopy from '@tabler/icons-svelte-runes/icons/copy';
	import IconExternalLink from '@tabler/icons-svelte-runes/icons/external-link';
	import IconLayoutSidebar from '@tabler/icons-svelte-runes/icons/layout-sidebar';
	import { toast } from 'svelte-sonner';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { tooltip } from '$lib/actions/tooltip';

	interface Props {
		onNewProject: () => void;
	}

	let { onNewProject }: Props = $props();

	const overlay = $derived(editorState.isNarrow);

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days} days ago`;
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	async function openProject(id: string) {
		await editorState.loadProject(id);
		if (overlay) editorState.sidebarOpen = false;
	}

	async function handleDelete(e: Event, id: string) {
		e.stopPropagation();
		const removed = await editorState.removeProject(id);
		if (!removed) return;
		toast(`Deleted “${removed.name}”`, {
			action: { label: 'Undo', onClick: () => editorState.restoreProject(removed) }
		});
	}

	function copyShare(e: Event, url: string) {
		e.stopPropagation();
		copyText(url)
			.then(() => toast.success('Share link copied'))
			.catch(() => copyFailed(url, 'share link'));
	}

	function openShare(e: Event, url: string) {
		e.stopPropagation();
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	async function forgetShare(e: Event, shareId: string) {
		e.stopPropagation();
		await editorState.forgetShare(shareId);
	}
</script>

{#if overlay && editorState.sidebarOpen}
	<button
		class="scrim"
		aria-label="Close sidebar"
		onclick={() => (editorState.sidebarOpen = false)}
	></button>
{/if}

<aside
	class="sidebar"
	class:open={editorState.sidebarOpen}
	class:overlay
	aria-hidden={!editorState.sidebarOpen}
	inert={!editorState.sidebarOpen}
>
	<div class="panel">
		<div class="sidebar-header">
			<button
				class="icon-btn"
				onclick={() => editorState.toggleSidebar()}
				use:tooltip={{ label: 'Close sidebar', shortcut: 'sidebar' }}
				aria-label="Close sidebar"
			>
				<IconLayoutSidebar size={18} />
			</button>
			<h2>Projects</h2>
			<button class="icon-btn" onclick={onNewProject} use:tooltip={{ label: 'New project', shortcut: 'newProject' }} aria-label="New project">
				<IconPlus size={18} />
			</button>
		</div>

		<div class="project-list" use:scroll>
			{#if editorState.projects.length === 0}
				<p class="empty">No projects yet. Start typing and one is created for you.</p>
			{:else}
				{#each editorState.projects as project (project.id)}
					<div
						class="item project-item"
						class:active={editorState.currentProject?.id === project.id}
						onclick={() => openProject(project.id)}
						onkeydown={(e) => e.key === 'Enter' && openProject(project.id)}
						role="button"
						tabindex="0"
						aria-current={editorState.currentProject?.id === project.id ? 'true' : undefined}
					>
						<div class="item-info">
							<span class="item-name">{project.name}</span>
							<span class="item-date">{formatDate(project.updatedAt)}</span>
						</div>
						<div class="item-actions">
							<button
								class="icon-btn sm danger"
								onclick={(e) => handleDelete(e, project.id)}
								use:tooltip={{ label: 'Delete project' }}
								aria-label="Delete {project.name}"
							>
								<IconTrash size={14} />
							</button>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<section class="shares">
			<button
				class="shares-header"
				onclick={() => editorState.toggleShares()}
				aria-expanded={editorState.sharesOpen}
			>
				<span class="chevron" class:open={editorState.sharesOpen}>
					<IconChevronDown size={12} />
				</span>
				<h2>Shares</h2>
				{#if editorState.shares.length > 0}
					<span class="shares-count">{editorState.shares.length}</span>
				{/if}
			</button>

			{#if editorState.sharesOpen}
				<div class="shares-list" use:scroll transition:slide={{ duration: 200, easing: cubicOut }}>
					{#if editorState.shares.length === 0}
						<p class="empty">Shared snapshots show up here.</p>
					{:else}
						{#each editorState.shares as share (share.shareId)}
							<div
								class="item share-item"
								onclick={(e) => copyShare(e, share.url)}
								onkeydown={(e) => e.key === 'Enter' && copyShare(e, share.url)}
								role="button"
								tabindex="0"
								use:tooltip={{ label: 'Copy link' }}
							>
								<div class="item-info">
									<span class="item-name">{share.title}</span>
									<span class="item-date">{formatDate(share.createdAt)}</span>
								</div>
								<div class="item-actions">
									<button
										class="icon-btn sm"
										onclick={(e) => copyShare(e, share.url)}
										use:tooltip={{ label: 'Copy link' }}
										aria-label="Copy link"
									>
										<IconCopy size={13} />
									</button>
									<button
										class="icon-btn sm"
										onclick={(e) => openShare(e, share.url)}
										use:tooltip={{ label: 'Open in new tab' }}
										aria-label="Open in new tab"
									>
										<IconExternalLink size={13} />
									</button>
									<button
										class="icon-btn sm danger"
										onclick={(e) => forgetShare(e, share.shareId)}
										use:tooltip={{ label: 'Forget locally' }}
										aria-label="Forget locally"
									>
										<IconTrash size={13} />
									</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		</section>
	</div>
</aside>

<style>
	.sidebar {
		--sidebar-width: 248px;
		position: relative;
		flex-shrink: 0;
		width: 0;
		height: 100%;
		overflow: hidden;
		transition: width var(--dur-slow) var(--ease-drawer);
	}

	.sidebar.open {
		width: var(--sidebar-width);
	}

	.panel {
		display: flex;
		flex-direction: column;
		width: var(--sidebar-width);
		height: 100%;
		background: var(--color-surface);
		box-shadow: inset -1px 0 0 var(--color-border);
		transform: translateX(-24px);
		opacity: 0;
		transition:
			transform var(--dur-slow) var(--ease-drawer),
			opacity var(--dur) ease;
	}

	.sidebar.open .panel {
		transform: none;
		opacity: 1;
	}

	.sidebar.overlay {
		--sidebar-width: min(300px, 85vw);
		position: fixed;
		inset: 0 auto 0 0;
		z-index: 50;
		width: var(--sidebar-width);
		overflow: visible;
		pointer-events: none;
	}

	.sidebar.overlay .panel {
		transform: translateX(-100%);
		opacity: 1;
		box-shadow: var(--shadow-pop);
	}

	.sidebar.overlay.open .panel {
		transform: none;
		pointer-events: auto;
	}

	.scrim {
		position: fixed;
		inset: 0;
		z-index: 49;
		background: var(--scrim);
		cursor: default;
		animation: fade-in var(--dur) ease both;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
		height: 48px;
		padding: 0 10px 0 calc(var(--space-unit) * 1.5);
		box-shadow: 0 1px 0 var(--color-border);
	}

	.sidebar-header h2 {
		flex: 1;
	}

	h2 {
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--color-text-muted);
	}

	.project-list {
		flex: 1;
		min-height: 0;
		padding: 6px;
	}

	.empty {
		padding: calc(var(--space-unit) * 2);
		font-size: 13px;
		color: var(--color-text-muted);
		text-align: center;
		text-wrap: pretty;
	}

	.item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 4px;
		width: 100%;
		padding: 7px 6px 7px 10px;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: background-color var(--dur-fast) ease;
	}

	.item + .item {
		margin-top: 1px;
	}

	.project-item.active {
		background: var(--color-hover);
	}

	.item-info {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.item-name {
		font-size: 14px;
		font-weight: 500;
		line-height: 1.35;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.share-item .item-name {
		font-size: 13px;
	}

	.item-date {
		font-size: 12px;
		line-height: 1.35;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.item-actions {
		display: flex;
		gap: 2px;
		flex-shrink: 0;
	}

	@media (hover: hover) {
		.item:hover {
			background: var(--color-hover);
		}

		.item-actions {
			opacity: 0;
			transition: opacity var(--dur-fast) ease;
		}

		.item:hover .item-actions,
		.item:focus-within .item-actions {
			opacity: 1;
		}
	}

	.item :global(.icon-btn.sm:hover) {
		background: var(--color-surface);
	}

	.shares {
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		max-height: 40%;
		box-shadow: 0 -1px 0 var(--color-border);
	}

	.shares-header {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		height: 40px;
		flex-shrink: 0;
		padding: 0 calc(var(--space-unit) * 2);
		color: var(--color-text-muted);
		text-align: left;
		transition: color var(--dur-fast) ease;
	}

	@media (hover: hover) {
		.shares-header:hover,
		.shares-header:hover h2 {
			color: var(--color-text);
		}
	}

	.shares-header h2 {
		flex: 1;
		transition: color var(--dur-fast) ease;
	}

	.chevron {
		display: inline-flex;
		transform: rotate(-90deg);
		transition: transform var(--dur) var(--ease-out);
	}

	.chevron.open {
		transform: none;
	}

	.shares-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 6px;
		font-size: 11px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted);
		background: var(--color-bg);
		box-shadow: var(--shadow-border);
		border-radius: 999px;
	}

	.shares-list {
		min-height: 0;
		padding: 0 6px 6px;
	}
</style>
