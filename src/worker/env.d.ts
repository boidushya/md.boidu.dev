/// <reference types="@cloudflare/workers-types" />

export interface Env {
	ASSETS: Fetcher;
	SHARES: R2Bucket;
}
