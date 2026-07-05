import type { CreateClientConfig } from './client/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
	...config,
	// Prefer an explicitly passed baseUrl, then a Node env var, then the default.
	// `typeof process` guards against browser bundles (e.g. the widget IIFE) where
	// `process` is undefined — referencing it directly throws "process is not defined".
	baseUrl:
		config?.baseUrl ??
		(typeof process !== 'undefined' ? process.env?.OPENCALS_API_URL : undefined) ??
		'https://api.opencals.com',
	headers: {
		...config?.headers,
		'X-Api-Version': '1',
	},
});
