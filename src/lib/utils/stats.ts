const WORDS_PER_MINUTE = 230;

export function textStats(markdown: string): { words: number; minutes: number } {
	const prose = markdown
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[#>*_`~|-]/g, ' ');
	const words = prose.match(/[\p{L}\p{N}][\p{L}\p{N}'’]*/gu)?.length ?? 0;
	return { words, minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)) };
}
