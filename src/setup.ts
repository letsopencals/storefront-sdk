import { client } from './client/client.gen';
import { apiKeyInterceptor } from './interceptors/api-key';
import { createLoggingRequestInterceptor, createLoggingResponseInterceptor, type LoggingOptions } from './interceptors/logging';
import { errorHandlerInterceptor } from './interceptors/error-handler';

export interface SetupOptions {
	/** Opencals API base URL. Defaults to OPENCALS_API_URL env var or https://api.opencals.com */
	baseUrl?: string;
	/** API key override. Defaults to OPENCALS_API_KEY env var */
	apiKey?: string;
	/** Enable request/response logging. Pass true for defaults or LoggingOptions to customize. */
	logging?: boolean | LoggingOptions;
	/** Enable error handler interceptor that throws OpencalsApiError. Defaults to true. */
	errorHandler?: boolean;
	/** Customer access token for authenticated requests */
	customerToken?: string;
}

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
		customerToken,
	} = options;

	// Configure base URL if provided
	if (baseUrl) {
		client.setConfig({ baseUrl });
	}

	// API key interceptor (uses env var or provided key)
	if (apiKey) {
		client.interceptors.request.use((requestOptions) => {
			requestOptions.headers.set('X-Api-Key', apiKey);
		});
	} else {
		client.interceptors.request.use(apiKeyInterceptor);
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
