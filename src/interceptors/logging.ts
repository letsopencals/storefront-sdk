import type { ResolvedRequestOptions } from '../client/client/types.gen';

export interface LoggingOptions {
	/** Custom logger function. Defaults to console.log */
	logger?: (...args: unknown[]) => void;
	/** Prefix for log messages. Defaults to "[Opencals]" */
	prefix?: string;
	/** Log request bodies. Defaults to false */
	logRequestBody?: boolean;
	/** Log response bodies. Defaults to false */
	logResponseBody?: boolean;
}

const defaultOptions: Required<LoggingOptions> = {
	logger: console.log,
	prefix: '[Opencals]',
	logRequestBody: false,
	logResponseBody: false,
};

/**
 * Creates a request interceptor that logs outgoing API requests.
 */
export function createLoggingRequestInterceptor(options?: LoggingOptions) {
	const opts = { ...defaultOptions, ...options };

	return function loggingRequestInterceptor(requestOptions: ResolvedRequestOptions): void {
		opts.logger(`${opts.prefix} ${requestOptions.method} ${requestOptions.url}`);
	};
}

/**
 * Creates a response interceptor that logs API responses.
 */
export function createLoggingResponseInterceptor(options?: LoggingOptions) {
	const opts = { ...defaultOptions, ...options };

	return function loggingResponseInterceptor(response: Response, _requestOptions: ResolvedRequestOptions): Response {
		const status = response.status;
		const statusText = status >= 400 ? '!!' : 'OK';
		opts.logger(`${opts.prefix} ${status} ${statusText} ${response.url}`);
		return response;
	};
}
