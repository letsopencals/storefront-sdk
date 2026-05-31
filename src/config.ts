import type { CreateClientConfig } from './client/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
	...config,
	baseUrl: process.env.OPENCALS_API_URL ?? 'https://api.opencals.com',
	headers: {
		...config?.headers,
		'X-Api-Version': '1',
	},
});
