import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
	input: 'https://api.opencals.com/docs/storefront-json',
	output: {
		path: 'src/client',
	},
	plugins: [
		'@hey-api/typescript',
		'@hey-api/sdk',
		{
			name: '@hey-api/client-next',
			runtimeConfigPath: './src/config',
		},
		'zod',
	],
});
