/// <reference types="@cloudflare/workers-types" />
import type { Env } from './env';

const MAX_SHARE_BYTES = 10 * 1024 * 1024;
const ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const ID_LENGTH = 10;
const ID_PATTERN = /^[A-Za-z0-9_-]{10}$/;

function generateId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(ID_LENGTH));
	let out = '';
	for (let i = 0; i < ID_LENGTH; i++) {
		out += ID_ALPHABET[bytes[i] & 63];
	}
	return out;
}

async function handleCreateShare(request: Request, env: Env): Promise<Response> {
	const contentLength = request.headers.get('content-length');
	if (!contentLength) {
		return new Response('Content-Length required', { status: 411 });
	}
	const size = Number(contentLength);
	if (!Number.isFinite(size) || size <= 0) {
		return new Response('Invalid Content-Length', { status: 400 });
	}
	if (size > MAX_SHARE_BYTES) {
		return new Response('Payload too large', { status: 413 });
	}

	const body = await request.arrayBuffer();
	if (body.byteLength > MAX_SHARE_BYTES) {
		return new Response('Payload too large', { status: 413 });
	}

	const id = generateId();
	await env.SHARES.put(`shares/${id}`, body, {
		httpMetadata: { contentType: 'application/octet-stream' },
		customMetadata: { v: '1', createdAt: Date.now().toString() }
	});

	return Response.json({ id });
}

async function handleGetShare(id: string, env: Env): Promise<Response> {
	if (!ID_PATTERN.test(id)) {
		return new Response('Bad id', { status: 400 });
	}
	const obj = await env.SHARES.get(`shares/${id}`);
	if (!obj) {
		return new Response('Not found', { status: 404 });
	}
	return new Response(obj.body, {
		headers: {
			'Content-Type': 'application/octet-stream',
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/api/share' && request.method === 'POST') {
			return handleCreateShare(request, env);
		}

		if (url.pathname.startsWith('/api/share/') && request.method === 'GET') {
			const id = url.pathname.slice('/api/share/'.length);
			return handleGetShare(id, env);
		}

		if (url.pathname.startsWith('/api/')) {
			return new Response('Not found', { status: 404 });
		}

		return env.ASSETS.fetch(request);
	}
} satisfies ExportedHandler<Env>;
