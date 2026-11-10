<script lang="ts">
	import { theme } from '$lib/stores/theme.svelte';
	import IconMoon from '@tabler/icons-svelte-runes/icons/moon';
	import IconSun from '@tabler/icons-svelte-runes/icons/sun';

	const dark = $derived(theme.resolved === 'dark');
</script>

<button
	class="icon-btn"
	onclick={() => theme.toggle()}
	title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
	aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
>
	<span class="icon" data-keep-transition class:shown={dark}><IconSun size={18} /></span>
	<span class="icon" data-keep-transition class:shown={!dark}><IconMoon size={18} /></span>
</button>

<style>
	.icon {
		grid-area: 1 / 1;
		display: grid;
		opacity: 0;
		scale: 0.25;
		filter: blur(4px);
		transition:
			opacity 300ms cubic-bezier(0.2, 0, 0, 1),
			scale 300ms cubic-bezier(0.2, 0, 0, 1),
			filter 300ms cubic-bezier(0.2, 0, 0, 1);
	}

	.icon.shown {
		opacity: 1;
		scale: 1;
		filter: blur(0);
	}
</style>
