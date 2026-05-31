import type { ResolvedRequestOptions } from '../client/client/types.gen';

/**
 * Request interceptor that injects the Storefront API Key header.
 *
 * Reads from OPENCALS_API_KEY environment variable.
 * The API key (sfk_...) identifies the store for all requests.
 */
export function apiKeyInterceptor(options: ResolvedRequestOptions): void {
	const apiKey = process.env.OPENCALS_API_KEY;
	if (apiKey) {
		options.headers.set('X-Api-Key', apiKey);
	}
}
