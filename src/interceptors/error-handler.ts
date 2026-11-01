import type { ResolvedRequestOptions } from '../client/client/types.gen';

/**
 * Standardized API error with parsed response details.
 */
export class OpencalsApiError extends Error {
	readonly status: number;
	readonly statusText: string;
	readonly errors?: Array<{ property: string; messages: string[] }>;
	readonly url: string;
	/** Machine-readable reason when the API sends one, e.g. `CODE_EXPIRED` for a rejected discount code. */
	readonly code?: string;
	/**
	 * The parsed JSON error body, when there is one. Carries the extra fields some errors send, e.g. `orderId` with
	 * `CART_ALREADY_CHECKED_OUT` or `paymentStatus` with `PAYMENT_NOT_AUTHORIZED`.
	 */
	readonly body?: Record<string, unknown>;

	constructor(options: {
		message: string;
		status: number;
		statusText: string;
		url: string;
		errors?: Array<{ property: string; messages: string[] }>;
		code?: string;
		body?: Record<string, unknown>;
	}) {
		super(options.message);
		this.name = 'OpencalsApiError';
		this.status = options.status;
		this.statusText = options.statusText;
		this.url = options.url;
		this.errors = options.errors;
		this.code = options.code;
		this.body = options.body;
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
		code: typeof body?.code === 'string' ? body.code : undefined,
		body: body && typeof body === 'object' && !Array.isArray(body) ? body : undefined,
	});
}
