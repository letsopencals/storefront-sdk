import type { ResolvedRequestOptions } from '../client/client/types.gen';

/**
 * Header carrying the buyer's (end user's) IP when your server calls the API on their behalf. The API trusts it only
 * with a private storefront key (`spk_`) or an admin key (`sk_`); with a public key (`sfk_`) it is ignored.
 */
export const BUYER_IP_HEADER = 'X-Opencals-Buyer-Ip';

/** What a buyer IP resolver gets for each request. */
export interface BuyerIpRequest {
	/** Upper-case HTTP method, e.g. `GET`, `POST`. */
	method: string;
	/** The endpoint path template, e.g. `/storefront/auth/sign-in`. */
	url: string;
}

/**
 * Returns the IP of the buyer the current request is made for, or nothing to send no header (no request scope, a
 * background job, or a request you don't want to forward, e.g. GETs that render a cached page).
 */
export type BuyerIpResolver = (request: BuyerIpRequest) => string | null | undefined | Promise<string | null | undefined>;

/**
 * Request interceptor that sets `X-Opencals-Buyer-Ip` from a resolver. Never overrides a header passed per call, and
 * a resolver that throws only skips the header: forwarding must never break a request.
 */
export function createBuyerIpInterceptor(resolve: BuyerIpResolver) {
	return async (options: ResolvedRequestOptions): Promise<void> => {
		if (options.headers.has(BUYER_IP_HEADER)) {
			return;
		}
		try {
			const ip = await resolve({ method: (options.method ?? 'GET').toUpperCase(), url: options.url });
			const value = ip?.trim();
			if (value) {
				options.headers.set(BUYER_IP_HEADER, value);
			}
		} catch {
			// No request scope or a resolver bug: send the request without the header.
		}
	};
}
