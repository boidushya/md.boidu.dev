<script lang="ts">
	import { editorState } from '$lib/stores/editor.svelte';
	import { AddCircle, TrashBinMinimalistic } from '@solar-icons/svelte/Linear';

	interface Props {
		onNewProject: () => void;
	}

	let { onNewProject }: Props = $props();

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) {
			return 'Today';
		} else if (days === 1) {
			return 'Yesterday';
		} else if (days < 7) {
			return `${days} days ago`;
		} else {
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		}
	}

	async function handleDelete(e: Event, id: string) {
		e.stopPropagation();
		if (confirm('Delete this project?')) {
			await editorState.removeProject(id);
		}
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
</aside>

<style>
	.sidebar {
		width: 240px;
		height: 100%;
		background: var(--color-surface);
		border-right: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		transition: width var(--transition), opacity var(--transition);
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
		background: #fee2e2;
		color: #dc2626;
	}
</style>
