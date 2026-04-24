import { decrypt, encrypt, gunzip, gzip, toAB } from './crypto';

const MAX_CIPHERTEXT_BYTES = 10 * 1024 * 1024;

export interface SharePayload {
	content: string;
	title: string;
	createdAt: number;
}

export class ShareTooLarge extends Error {
	constructor() {
		super('Share exceeds maximum size');
		this.name = 'ShareTooLarge';
	}
}

export class ShareNotFound extends Error {
	constructor() {
		super('Share not found');
		this.name = 'ShareNotFound';
	}
}

export class ShareDecryptFailed extends Error {
	constructor() {
		super('Share could not be decrypted');
		this.name = 'ShareDecryptFailed';
	}
}

export async function hashPayload(content: string, title: string): Promise<string> {
	const bytes = new TextEncoder().encode(`${title}\x00${content}`);
	const digest = await crypto.subtle.digest('SHA-256', toAB(bytes));
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function createShare(
	payload: SharePayload
): Promise<{ id: string; keyB64: string; url: string }> {
	const compressed = await gzip(JSON.stringify(payload));
	const { ciphertext, keyB64 } = await encrypt(compressed);

	if (ciphertext.byteLength > MAX_CIPHERTEXT_BYTES) {
		throw new ShareTooLarge();
	}

	const res = await fetch('/api/share', {
		method: 'POST',
		body: toAB(ciphertext),
		headers: { 'Content-Type': 'application/octet-stream' }
	});

	if (res.status === 413) throw new ShareTooLarge();
	if (!res.ok) throw new Error(`Share upload failed: ${res.status}`);

	const { id } = (await res.json()) as { id: string };
	const url = `${location.origin}/s/${id}#k=${keyB64}`;
	return { id, keyB64, url };
}

export async function fetchShare(id: string, keyB64: string): Promise<SharePayload> {
	const res = await fetch(`/api/share/${id}`);
	if (res.status === 404) throw new ShareNotFound();
	if (!res.ok) throw new Error(`Share fetch failed: ${res.status}`);

	const buf = new Uint8Array(await res.arrayBuffer());

	let plaintext: Uint8Array;
	try {
		plaintext = await decrypt(buf, keyB64);
	} catch {
		throw new ShareDecryptFailed();
	}

	const json = await gunzip(plaintext);
	return JSON.parse(json) as SharePayload;
}
