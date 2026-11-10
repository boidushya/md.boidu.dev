import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const { WORKER_PORT = '8787' } = loadEnv(mode, '.', 'WORKER_');
	return {
		plugins: [sveltekit()],
		server: {
			proxy: {
				'/api': `http://localhost:${WORKER_PORT}`
			}
		}
	};
});
