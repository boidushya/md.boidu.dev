<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		width?: number;
		children: Snippet;
	}

	let { open = $bindable(), title, width = 360, children }: Props = $props();

	let dialog: HTMLDialogElement;
	const titleId = `dialog-${Math.random().toString(36).slice(2)}`;

	$effect(() => {
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	class="dialog"
	style:--width="{width}px"
	aria-labelledby={titleId}
	onclose={() => (open = false)}
	onclick={(e) => e.target === dialog && (open = false)}
>
	<div class="body">
		<h3 id={titleId}>{title}</h3>
		{@render children()}
	</div>
</dialog>

<style>
	.dialog {
		margin: auto;
		width: min(var(--width), calc(100vw - 32px));
		max-height: calc(100dvh - 32px);
		padding: 0;
		border: 1px solid transparent;
		border-radius: 16px;
		color: var(--color-text);
		background: var(--color-surface);
		box-shadow: var(--shadow-pop);
		overscroll-behavior: contain;
		opacity: 0;
		scale: 0.96;
		transition:
			opacity var(--dur-fast) ease-out,
			scale var(--dur-fast) ease-out,
			overlay var(--dur-fast) allow-discrete,
			display var(--dur-fast) allow-discrete;
	}

	.dialog[open] {
		opacity: 1;
		scale: 1;
		transition-duration: var(--dur);
		transition-timing-function: var(--ease-out);
	}

	@starting-style {
		.dialog[open] {
			opacity: 0;
			scale: 0.96;
		}
	}

	.dialog::backdrop {
		background: var(--scrim);
		opacity: 0;
		transition:
			opacity var(--dur-fast) ease-out,
			overlay var(--dur-fast) allow-discrete,
			display var(--dur-fast) allow-discrete;
	}

	.dialog[open]::backdrop {
		opacity: 1;
	}

	@starting-style {
		.dialog[open]::backdrop {
			opacity: 0;
		}
	}

	.body {
		padding: 20px;
	}

	h3 {
		margin-bottom: 14px;
		font-size: 15px;
		font-weight: 600;
	}
</style>
