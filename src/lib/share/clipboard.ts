import { toast } from 'svelte-sonner';

// Call synchronously inside the gesture: Safari loses activation across awaits, so pending text goes in as a promise.
export async function copyText(value: string | Promise<string>): Promise<void> {
	if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
		const blob = Promise.resolve(value).then((text) => new Blob([text], { type: 'text/plain' }));
		await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
		return;
	}
	await navigator.clipboard.writeText(await value);
}

export function copyFailed(text: string, label: string) {
	toast.error(`Could not copy ${label}`, {
		description: text,
		action: { label: 'Retry', onClick: () => copyText(text).then(() => toast.success('Copied')) },
		duration: 10000
	});
}
