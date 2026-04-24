<script lang="ts">
	import { editorState } from '$lib/stores/editor.svelte';
	import {
		AddCircle,
		TrashBinMinimalistic,
		AltArrowDown,
		Copy,
		Link
	} from '@solar-icons/svelte/Linear';
	import { toast } from 'svelte-sonner';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		onNewProject: () => void;
	}

	let { onNewProject }: Props = $props();

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days} days ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	async function handleDelete(e: Event, id: string) {
		e.stopPropagation();
		if (confirm('Delete this project?')) {
			await editorState.removeProject(id);
		}
	}

	async function copyShare(e: Event, url: string) {
		e.stopPropagation();
		await navigator.clipboard.writeText(url);
		toast.success('Share link copied');
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

<aside class="sidebar" class:open={editorState.sidebarOpen}>
	<div class="sidebar-header">
		<h2>Projects</h2>
		<button class="new-btn" onclick={onNewProject} title="New Project">
			<AddCircle size={16} />
		</button>
	</div>

	<div class="project-list">
		{#if editorState.projects.length === 0}
			<p class="empty">No projects yet</p>
		{:else}
			{#each editorState.projects as project (project.id)}
				<div
					class="project-item"
					class:active={editorState.currentProject?.id === project.id}
					onclick={() => editorState.loadProject(project.id)}
					onkeydown={(e) => e.key === 'Enter' && editorState.loadProject(project.id)}
					role="button"
					tabindex="0"
				>
					<div class="project-info">
						<span class="project-name">{project.name}</span>
						<span class="project-date">{formatDate(project.updatedAt)}</span>
					</div>
					<button
						class="delete-btn"
						onclick={(e) => handleDelete(e, project.id)}
						title="Delete project"
					>
						<TrashBinMinimalistic size={14} />
					</button>
				</div>
			{/each}
		{/if}
	</div>

	<section class="shares">
		<button
			class="shares-header"
			onclick={() => editorState.toggleShares()}
			aria-expanded={editorState.sharesOpen}
			title={editorState.sharesOpen ? 'Collapse shares' : 'Expand shares'}
		>
			<span class="chevron" class:open={editorState.sharesOpen}>
				<AltArrowDown size={12} />
			</span>
			<h2>Shares</h2>
			{#if editorState.shares.length > 0}
				<span class="shares-count">{editorState.shares.length}</span>
			{/if}
		</button>

		{#if editorState.sharesOpen}
			<div class="shares-list" transition:slide={{ duration: 200, easing: cubicOut }}>
				{#if editorState.shares.length === 0}
					<p class="empty">No shares yet</p>
				{:else}
					{#each editorState.shares as share (share.shareId)}
						<div
							class="share-item"
							onclick={(e) => copyShare(e, share.url)}
							onkeydown={(e) => e.key === 'Enter' && copyShare(e, share.url)}
							role="button"
							tabindex="0"
							title="Click to copy link"
						>
							<div class="share-info">
								<span class="share-name">{share.title}</span>
								<span class="share-date">{formatDate(share.createdAt)}</span>
							</div>
							<div class="share-actions">
								<button
									class="share-btn"
									onclick={(e) => copyShare(e, share.url)}
									title="Copy link"
								>
									<Copy size={13} />
								</button>
								<button
									class="share-btn"
									onclick={(e) => openShare(e, share.url)}
									title="Open in new tab"
								>
									<Link size={13} />
								</button>
								<button
									class="share-btn danger"
									onclick={(e) => forgetShare(e, share.shareId)}
									title="Forget locally"
								>
									<TrashBinMinimalistic size={13} />
								</button>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</section>
</aside>

<style>
	.sidebar {
		width: 240px;
		height: 100%;
		background: var(--color-surface);
		border-right: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		transition:
			width var(--transition),
			opacity var(--transition);
		overflow: hidden;
	}

	.sidebar:not(.open) {
		width: 0;
		border-right: none;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 48px;
		padding: 0 calc(var(--space-unit) * 2);
		border-bottom: 1px solid var(--color-border);
	}

	.sidebar-header h2 {
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--color-text-muted);
	}

	.new-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		transition: all var(--transition);
	}

	.new-btn:hover {
		background: var(--color-bg);
		color: var(--color-text);
	}

	.project-list {
		flex: 1;
		overflow-y: auto;
		padding: calc(var(--space-unit) * 1);
	}

	.empty {
		padding: calc(var(--space-unit) * 2);
		font-size: 13px;
		color: var(--color-text-muted);
		text-align: center;
		white-space: nowrap;
	}

	.project-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: calc(var(--space-unit) * 1) calc(var(--space-unit) * 1.5);
		border-radius: var(--radius-sm);
		text-align: left;
		cursor: pointer;
		transition: background var(--transition);
	}

	.project-item:hover {
		background: var(--color-bg);
	}

	.project-item.active {
		background: var(--color-bg);
	}

	.project-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.project-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.project-date {
		font-size: 12px;
		color: var(--color-text-muted);
	}

	.delete-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		opacity: 0;
		transition: all var(--transition);
	}

	.project-item:hover .delete-btn {
		opacity: 1;
	}

	.delete-btn:hover {
		background: var(--color-danger-bg);
		color: var(--color-danger-fg);
	}

	/* Shares section */
	.shares {
		border-top: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.shares-header {
		display: flex;
		align-items: center;
		gap: calc(var(--space-unit) * 0.75);
		width: 100%;
		height: 40px;
		padding: 0 calc(var(--space-unit) * 2);
		color: var(--color-text-muted);
		text-align: left;
		transition: color var(--transition);
		flex-shrink: 0;
	}

	.shares-header:hover {
		color: var(--color-text);
	}

	.shares-header h2 {
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		flex: 1;
	}

	.chevron {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transform: rotate(-90deg);
		transition: transform var(--transition);
	}

	.chevron.open {
		transform: rotate(0deg);
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
		color: var(--color-text-muted);
		background: var(--color-bg);
		border-radius: 999px;
	}

	.shares-list {
		max-height: 22vh;
		overflow-y: auto;
		padding: 0 calc(var(--space-unit) * 1) calc(var(--space-unit) * 1);
	}

	.share-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: calc(var(--space-unit) * 0.5);
		width: 100%;
		padding: calc(var(--space-unit) * 0.75) calc(var(--space-unit) * 1.5);
		border-radius: var(--radius-sm);
		text-align: left;
		cursor: pointer;
		transition: background var(--transition);
	}

	.share-item:hover {
		background: var(--color-bg);
	}

	.share-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}

	.share-name {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.share-date {
		font-size: 11px;
		color: var(--color-text-muted);
	}

	.share-actions {
		display: flex;
		gap: 2px;
		opacity: 0;
		transition: opacity var(--transition);
		flex-shrink: 0;
	}

	.share-item:hover .share-actions,
	.share-item:focus-within .share-actions {
		opacity: 1;
	}

	.share-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		transition: all var(--transition);
	}

	.share-btn:hover {
		background: var(--color-surface);
		color: var(--color-text);
	}

	.share-btn.danger:hover {
		background: var(--color-danger-bg);
		color: var(--color-danger-fg);
	}
</style>
