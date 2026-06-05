import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
	input: 'https://api.opencals.com/docs/storefront-json',
	output: {
		path: 'src/client',
	},
	plugins: [
		'@hey-api/typescript',
		{
			name: '@hey-api/sdk',
			operations: {
				strategy: 'byTags',
				containerName: (tag: string) => {
					// Singularize and add "Service" suffix
					// "Products" → "ProductService", "Staff Members" → "StaffMemberService"
					const pascal = tag.replace(/[\s-]+/g, '');
					if (pascal.endsWith('Service')) return pascal;
					const singular = pascal.replace(/ies$/, 'y').replace(/s$/, '');
					return `${singular}Service`;
				},
				methodName: (operationId: string) => {
					// Strip the controller prefix (everything before the first underscore)
					// e.g. "product_list" → "list", "auth_signIn" → "signIn"
					const idx = operationId.indexOf('_');
					return idx >= 0 ? operationId.slice(idx + 1) : operationId;
				},
			},
		},
		{
			name: '@hey-api/client-next',
			runtimeConfigPath: './src/config',
		},
		'zod',
	],
});
