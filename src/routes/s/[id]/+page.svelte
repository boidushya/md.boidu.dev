<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Preview from '$lib/components/Preview.svelte';
	import {
		fetchShare,
		ShareNotFound,
		ShareDecryptFailed,
		type SharePayload
	} from '$lib/share/service';
	import { editorState } from '$lib/stores/editor.svelte';

	type Status = 'loading' | 'ready' | 'error';

	let status = $state<Status>('loading');
	let errorMessage = $state('');
	let payload = $state<SharePayload | null>(null);
	let forking = $state(false);

	function readKeyFromHash(): string | null {
		if (typeof location === 'undefined') return null;
		const h = location.hash;
		if (h.startsWith('#k=')) return h.slice(3);
		return null;
	}

	onMount(async () => {
		const id = page.params.id;
		const key = readKeyFromHash();

		if (!id) {
			status = 'error';
			errorMessage = 'No share ID in the URL.';
			return;
		}

		if (!key) {
			status = 'error';
			errorMessage = 'This link is incomplete — the decryption key is missing from the URL.';
			return;
		}

		try {
			payload = await fetchShare(id, key);
			status = 'ready';
		} catch (err) {
			status = 'error';
			if (err instanceof ShareNotFound) {
				errorMessage = 'This share does not exist. The link may be wrong or the content may have been removed.';
			} else if (err instanceof ShareDecryptFailed) {
				errorMessage = 'Decryption failed. The key in the URL may be wrong or the content corrupted.';
			} else {
				errorMessage = 'Something went wrong while loading this share.';
				console.error(err);
			}
		}
	});

	async function handleFork() {
		if (!payload || forking) return;
		forking = true;
		await editorState.forkFromShare(`${payload.title} (fork)`, payload.content);
		await goto('/');
	}

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	{#if payload}
		<title>{payload.title}</title>
	{:else}
		<title>Shared document</title>
	{/if}
</svelte:head>

<div class="viewer">
	<header class="viewer-header">
		<div class="viewer-header-left">
			{#if payload}
				<h1 class="viewer-title">{payload.title}</h1>
				<span class="viewer-meta">Shared {formatDate(payload.createdAt)}</span>
			{:else}
				<h1 class="viewer-title">Shared document</h1>
			{/if}
		</div>
		<div class="viewer-header-right">
			{#if status === 'ready'}
				<button class="btn-primary" onclick={handleFork} disabled={forking}>
					{forking ? 'Forking…' : 'Fork to editor'}
				</button>
			{/if}
			<a class="btn-secondary" href="/">Open editor</a>
		</div>
	</header>

	<div class="viewer-body">
		{#if status === 'loading'}
			<p class="viewer-state">Loading…</p>
		{:else if status === 'error'}
			<p class="viewer-state viewer-error">{errorMessage}</p>
		{:else if payload}
			<Preview content={payload.content} />
		{/if}
	</div>
</div>

<style>
	.viewer {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--color-bg);
	}

	.viewer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: calc(var(--space-unit) * 2);
		padding: calc(var(--space-unit) * 1.5) calc(var(--space-unit) * 3);
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
	}

	.viewer-header-left {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.viewer-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.viewer-meta {
		font-size: 12px;
		color: var(--color-text-muted);
	}

	.viewer-header-right {
		display: flex;
		align-items: center;
		gap: calc(var(--space-unit) * 1);
		flex-shrink: 0;
	}

	.viewer-body {
		flex: 1;
		overflow: hidden;
	}

	.viewer-state {
		padding: calc(var(--space-unit) * 4);
		color: var(--color-text-muted);
		text-align: center;
	}

	.viewer-error {
		color: var(--color-text);
		max-width: 42ch;
		margin: 0 auto;
		line-height: 1.6;
	}

	.btn-primary,
	.btn-secondary {
		padding: calc(var(--space-unit) * 1) calc(var(--space-unit) * 2);
		border-radius: var(--radius-sm);
		font-size: 13px;
		font-weight: 500;
		text-decoration: none;
		transition: all var(--transition);
	}

	.btn-primary {
		background: var(--color-text);
		color: var(--color-surface);
	}

	.btn-primary:hover {
		background: var(--color-text-muted);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-secondary {
		color: var(--color-text-muted);
	}

	.btn-secondary:hover {
		color: var(--color-text);
		background: var(--color-bg);
	}
</style>
