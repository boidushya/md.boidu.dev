const IV_BYTES = 12;
const KEY_BYTES = 32;

export function toAB(u: Uint8Array): ArrayBuffer {
	const out = new ArrayBuffer(u.byteLength);
	new Uint8Array(out).set(u);
	return out;
}

function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
	const pad = s.length % 4 === 2 ? '==' : s.length % 4 === 3 ? '=' : '';
	const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
	const binary = atob(b64);
	const out = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
	return out;
}

export async function gzip(text: string): Promise<Uint8Array> {
	const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
	const buf = await new Response(stream).arrayBuffer();
	return new Uint8Array(buf);
}

export async function gunzip(buf: Uint8Array): Promise<string> {
	const stream = new Blob([toAB(buf)]).stream().pipeThrough(new DecompressionStream('gzip'));
	return new Response(stream).text();
}

export async function encrypt(
	plaintext: Uint8Array
): Promise<{ ciphertext: Uint8Array; keyB64: string }> {
	const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
	const keyBytes = crypto.getRandomValues(new Uint8Array(KEY_BYTES));
	const key = await crypto.subtle.importKey('raw', toAB(keyBytes), { name: 'AES-GCM' }, false, [
		'encrypt'
	]);
	const ct = new Uint8Array(
		await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toAB(iv) }, key, toAB(plaintext))
	);
	const out = new Uint8Array(IV_BYTES + ct.length);
	out.set(iv, 0);
	out.set(ct, IV_BYTES);
	return { ciphertext: out, keyB64: toBase64Url(keyBytes) };
}

export async function decrypt(ciphertext: Uint8Array, keyB64: string): Promise<Uint8Array> {
	if (ciphertext.length <= IV_BYTES) throw new Error('Ciphertext too short');
	const iv = ciphertext.slice(0, IV_BYTES);
	const body = ciphertext.slice(IV_BYTES);
	const keyBytes = fromBase64Url(keyB64);
	if (keyBytes.length !== KEY_BYTES) throw new Error('Invalid key length');
	const key = await crypto.subtle.importKey('raw', toAB(keyBytes), { name: 'AES-GCM' }, false, [
		'decrypt'
	]);
	const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toAB(iv) }, key, toAB(body));
	return new Uint8Array(pt);
}
