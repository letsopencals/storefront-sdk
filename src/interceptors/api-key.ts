import type { ResolvedRequestOptions } from '../client/client/types.gen';

/**
 * Request interceptor that injects the Storefront API Key header.
 *
 * Reads from OPENCALS_API_KEY environment variable.
 * The API key (sfk_...) identifies the store for all requests.
 */
export function apiKeyInterceptor(options: ResolvedRequestOptions): void {
	// `typeof process` guards against browser bundles where `process` is undefined;
	// browser consumers should pass `apiKey` to setupOpencals() instead of relying
	// on this env fallback (which only resolves in Node).
	const apiKey = typeof process !== 'undefined' ? process.env?.OPENCALS_API_KEY : undefined;
	if (apiKey) {
		options.headers.set('X-Api-Key', apiKey);
	}
}
