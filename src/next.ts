/**
 * Next.js helpers: import from `@opencals/storefront-sdk/next` in server code only (route handlers, server actions,
 * server components). Requires `next` (an optional peer dependency).
 */
import { headers } from 'next/headers';
import type { BuyerIpRequest } from './interceptors/buyer-ip';

/**
 * A ready-made `buyerIp` resolver for Next.js apps:
 *
 * ```ts
 * import { setupOpencals } from '@opencals/storefront-sdk';
 * import { nextBuyerIp } from '@opencals/storefront-sdk/next';
 *
 * setupOpencals({ apiKey: process.env.OPENCALS_API_KEY, buyerIp: nextBuyerIp });
 * ```
 *
 * - Reads the visitor's IP from `x-real-ip`, else the first `x-forwarded-for` entry. Vercel sets both on every
 *   request and overwrites what the browser sends; behind another proxy, write your own resolver for the header it
 *   sets (e.g. `cloudfront-viewer-address` on CloudFront).
 * - Only for mutations: GET/HEAD return nothing, because reading request headers while rendering a GET would make
 *   cached pages dynamic.
 * - Outside a request (build, background work) it returns nothing, and the request goes out without the header.
 *
 * Takes effect with a private storefront key (`spk_`); the API ignores the header with a public key.
 */
export async function nextBuyerIp({ method }: BuyerIpRequest): Promise<string | undefined> {
	if (method === 'GET' || method === 'HEAD') return undefined;
	try {
		const h = await headers();
		return h.get('x-real-ip')?.trim() || h.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
	} catch {
		return undefined;
	}
}
