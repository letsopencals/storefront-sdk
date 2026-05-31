import type { ResolvedRequestOptions } from '../client/client/types.gen';

/**
 * Standardized API error with parsed response details.
 */
export class OpencalsApiError extends Error {
	readonly status: number;
	readonly statusText: string;
	readonly errors?: Array<{ property: string; messages: string[] }>;
	readonly url: string;

	constructor(options: {
		message: string;
		status: number;
		statusText: string;
		url: string;
		errors?: Array<{ property: string; messages: string[] }>;
	}) {
		super(options.message);
		this.name = 'OpencalsApiError';
		this.status = options.status;
		this.statusText = options.statusText;
		this.url = options.url;
		this.errors = options.errors;
	}

	/**
	 * Returns validation errors as a flat record { fieldName: "error message" }
	 * Useful for form error display.
	 */
	toFieldErrors(): Record<string, string> {
		if (!this.errors) return {};
		return this.errors.reduce(
			(acc, { property, messages }) => {
				acc[property] = messages.join(', ');
				return acc;
			},
			{} as Record<string, string>,
		);
	}
}

/**
 * Response interceptor that converts non-OK responses into OpencalsApiError.
 */
export async function errorHandlerInterceptor(response: Response, _requestOptions: ResolvedRequestOptions): Promise<Response> {
	if (response.ok) {
		return response;
	}

	let body: any = null;
	try {
		body = await response.clone().json();
	} catch {
		// Non-JSON error response
	}

	throw new OpencalsApiError({
		message: body?.message || response.statusText || `Request failed with status ${response.status}`,
		status: response.status,
		statusText: response.statusText,
		url: response.url,
		errors: body?.errors,
	});
}
