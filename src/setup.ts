import { client } from './client/client.gen';
import { apiKeyInterceptor } from './interceptors/api-key';
import { createLoggingRequestInterceptor, createLoggingResponseInterceptor, type LoggingOptions } from './interceptors/logging';
import { errorHandlerInterceptor } from './interceptors/error-handler';
import { createBuyerIpInterceptor, type BuyerIpResolver } from './interceptors/buyer-ip';

export interface SetupOptions {
	/** Opencals API base URL. Defaults to OPENCALS_API_URL env var or https://api.opencals.com */
	baseUrl?: string;
	/**
	 * API key override. Defaults to OPENCALS_API_KEY env var. Use a public storefront key (`sfk_`) in browser code
	 * and a private storefront key (`spk_`) on a server; both work with every storefront endpoint.
	 */
	apiKey?: string;
	/** Enable request/response logging. Pass true for defaults or LoggingOptions to customize. */
	logging?: boolean | LoggingOptions;
	/** Enable error handler interceptor that throws OpencalsApiError. Defaults to true. */
	errorHandler?: boolean;
	/**
	 * Re-throw failed requests as OpencalsApiError instead of returning `{ error }`.
	 * When false (the client default), the error-handler interceptor's throw is
	 * swallowed and calls resolve to `{ data: undefined, error }`. Defaults to the
	 * client default (false).
	 */
	throwOnError?: boolean;
	/** Customer access token for authenticated requests */
	customerToken?: string;
	/**
	 * Server-side only: returns the IP of the buyer a request is made for, sent as `X-Opencals-Buyer-Ip`. With a
	 * private storefront key (`spk_`) the API then rate-limits and protects sign-ups, logins and emails per buyer
	 * instead of per server (all your visitors otherwise share your server's IP). Ignored with a public key. Return
	 * nothing to skip a request.
	 */
	buyerIp?: BuyerIpResolver;
}

/** Keys that must stay on a server (the API rejects them from browsers). */
const SERVER_SIDE_KEY_PREFIXES = ['spk_', 'sk_'];

/**
 * Initialize the Opencals SDK client with interceptors.
 *
 * Call this once at app startup (e.g., in your root layout or API client singleton).
 *
 * @example
 * ```ts
 * import { setupOpencals } from '@opencals/storefront-sdk';
 *
 * setupOpencals({
 *   logging: true,
 * });
 * ```
 */
export function setupOpencals(options: SetupOptions = {}): typeof client {
	const {
		baseUrl,
		apiKey,
		logging = false,
		errorHandler = true,
		throwOnError,
		customerToken,
		buyerIp,
	} = options;

	// Configure base URL if provided
	if (baseUrl) {
		client.setConfig({ baseUrl });
	}

	// Opt in to re-throwing failed requests (leaves other consumers unaffected
	// when omitted — the client singleton is per-app-bundle).
	if (throwOnError !== undefined) {
		client.setConfig({ throwOnError });
	}

	// API key interceptor (uses env var or provided key)
	if (apiKey) {
		client.interceptors.request.use((requestOptions) => {
			requestOptions.headers.set('X-Api-Key', apiKey);
		});
	} else {
		client.interceptors.request.use(apiKeyInterceptor);
	}

	// Private keys are secret: warn when one ends up in a browser bundle (the API rejects it there anyway).
	if (typeof window !== 'undefined' && apiKey && SERVER_SIDE_KEY_PREFIXES.some((prefix) => apiKey.startsWith(prefix))) {
		console.warn(
			'[opencals] A private API key is used in the browser. Keep spk_/sk_ keys on your server and use a public storefront key (sfk_) in browser code.',
		);
	}

	// Buyer IP forwarding (server-side, private keys)
	if (buyerIp) {
		client.interceptors.request.use(createBuyerIpInterceptor(buyerIp));
	}

	// Customer auth token
	if (customerToken) {
		client.interceptors.request.use((requestOptions) => {
			requestOptions.headers.set('Authorization', `Bearer ${customerToken}`);
		});
	}

	// Logging
	if (logging) {
		const loggingOpts = typeof logging === 'object' ? logging : undefined;
		client.interceptors.request.use(createLoggingRequestInterceptor(loggingOpts));
		client.interceptors.response.use(createLoggingResponseInterceptor(loggingOpts));
	}

	// Error handler
	if (errorHandler) {
		client.interceptors.response.use(errorHandlerInterceptor);
	}

	return client;
}
