<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Preview from '$lib/components/Preview.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import {
		fetchShare,
		ShareNotFound,
		ShareDecryptFailed,
		type SharePayload
	} from '$lib/share/service';
	import { copyFailed, copyText } from '$lib/share/clipboard';
	import { editorState } from '$lib/stores/editor.svelte';
	import IconCopy from '@tabler/icons-svelte-runes/icons/copy';
	import IconDownload from '@tabler/icons-svelte-runes/icons/download';
	import IconPencil from '@tabler/icons-svelte-runes/icons/pencil';
	import { toast } from 'svelte-sonner';

	type Status = 'loading' | 'ready' | 'error';

	let status = $state<Status>('loading');
	let errorMessage = $state('');
	let payload = $state<SharePayload | null>(null);
	let forking = $state(false);

	function readKeyFromHash(): string | null {
		const h = location.hash;
		return h.startsWith('#k=') ? h.slice(3) : null;
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
			errorMessage = 'This link is incomplete. The decryption key is missing from the URL.';
			return;
		}

		try {
			payload = await fetchShare(id, key);
			status = 'ready';
		} catch (err) {
			status = 'error';
			if (err instanceof ShareNotFound) {
				errorMessage = 'This share does not exist. The link may be wrong, or the content was removed.';
			} else if (err instanceof ShareDecryptFailed) {
				errorMessage = 'This share could not be decrypted. The key in the URL may be wrong.';
			} else {
				errorMessage = 'Something went wrong while loading this share. Try again in a moment.';
				console.error(err);
			}
		}
	});

	async function handleFork() {
		if (!payload || forking) return;
		forking = true;
		await editorState.createFromContent(`${payload.title} (fork)`, payload.content);
		await goto('/');
	}

	function handleCopy() {
		if (!payload) return;
		const { content } = payload;
		copyText(content)
			.then(() => toast.success('Markdown copied'))
			.catch(() => copyFailed(content, 'Markdown'));
	}

	function handleDownload() {
		if (!payload) return;
		const blob = new Blob([payload.content], { type: 'text/markdown;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${payload.title.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'document'}.md`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>{payload?.title ?? 'Shared document'}</title>
</svelte:head>

<div class="viewer">
	<header class="viewer-header">
		<div class="viewer-header-left">
			{#if payload}
				<h1 class="viewer-title">{payload.title}</h1>
				<span class="viewer-meta">Shared {formatDate(payload.createdAt)}</span>
			{:else}
				<h1 class="viewer-title">{status === 'error' ? 'Share unavailable' : 'Shared document'}</h1>
			{/if}
		</div>
		<div class="viewer-actions">
			{#if status === 'ready'}
				<button class="btn" onclick={handleCopy} title="Copy Markdown" aria-label="Copy Markdown">
					<IconCopy size={16} /><span class="label">Copy</span>
				</button>
				<button class="btn" onclick={handleDownload} title="Download .md" aria-label="Download .md">
					<IconDownload size={16} /><span class="label">Download</span>
				</button>
			{/if}
			<ThemeToggle />
			{#if status === 'ready'}
				<button class="btn primary" onclick={handleFork} disabled={forking} aria-label="Fork to editor">
					<IconPencil size={16} /><span class="label">{forking ? 'Forking…' : 'Fork to editor'}</span>
				</button>
			{:else}
				<a class="btn" href="/">Open editor</a>
			{/if}
		</div>
	</header>

	<div class="viewer-body">
		{#if status === 'loading'}
			<div class="skeleton" aria-label="Loading" role="status">
				<span style:width="45%" class="line heading"></span>
				<span style:width="92%" class="line"></span>
				<span style:width="86%" class="line"></span>
				<span style:width="64%" class="line"></span>
				<span style:width="90%" class="line gap"></span>
				<span style:width="78%" class="line"></span>
			</div>
		{:else if status === 'error'}
			<div class="error-card" role="alert">
				<p>{errorMessage}</p>
				<a class="btn primary" href="/">Open the editor</a>
			</div>
		{:else if payload}
			<Preview content={payload.content} />
		{/if}
	</div>
</div>

<style>
	.viewer {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		background: var(--color-editor);
	}

	.viewer-header {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: calc(var(--space-unit) * 2);
		min-height: 56px;
		padding: 8px 12px 8px calc(var(--space-unit) * 3);
		background: var(--color-surface);
		box-shadow: 0 1px 0 var(--color-border);
	}

	.viewer-header-left {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.viewer-title {
		font-size: 15px;
		font-weight: 600;
		line-height: 1.35;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.viewer-meta {
		font-size: 12px;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.viewer-actions {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}

	.viewer-actions .primary {
		margin-left: 4px;
	}

	.viewer-body {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.skeleton {
		display: flex;
		flex-direction: column;
		gap: 12px;
		max-width: 72ch;
		margin: 0 auto;
		padding: calc(var(--space-unit) * 4) calc(var(--space-unit) * 3);
	}

	.line {
		height: 12px;
		border-radius: 6px;
		background: var(--color-hover);
		animation: pulse 1.4s ease-in-out infinite;
	}

	.line.heading {
		height: 22px;
		margin-bottom: 8px;
	}

	.line.gap {
		margin-top: 12px;
	}

	@keyframes pulse {
		50% {
			opacity: 0.5;
		}
	}

	.error-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		max-width: 400px;
		margin: 12vh auto 0;
		padding: 24px;
		text-align: center;
		text-wrap: pretty;
		color: var(--color-text-muted);
	}

	@media (max-width: 720px) {
		.viewer-header {
			padding-left: calc(var(--space-unit) * 2);
		}

		.label {
			display: none;
		}

		.viewer-actions .btn {
			width: 32px;
			padding: 0;
		}

		.viewer-actions a.btn {
			width: auto;
			padding: 0 12px;
		}
	}

	@media print {
		.viewer-header {
			display: none;
		}

		.viewer,
		.viewer-body {
			height: auto;
			overflow: visible;
		}
	}
</style>
