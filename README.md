# @opencals/storefront-sdk

Type-safe TypeScript SDK for the [Opencals](https://opencals.com) Storefront API. Build custom booking websites with real-time availability, cart management, checkout, and customer accounts.

## Install

```bash
npm install @opencals/storefront-sdk
```

## Quick Start

```ts
import { setupOpencals, customerProductList } from '@opencals/storefront-sdk';

// Initialize once at app startup
setupOpencals({
  apiKey: 'sfk_your_key_here',
});

// Fetch products
const { data } = await customerProductList();
console.log(data);
```

## Setup

Call `setupOpencals()` once in your app entry point (e.g., root layout or API client singleton):

```ts
import { setupOpencals } from '@opencals/storefront-sdk';

setupOpencals({
  apiKey: 'sfk_...',          // or set OPENCALS_API_KEY env var
  baseUrl: 'https://...',     // optional, defaults to https://api.opencals.com
  logging: true,              // optional request/response logging
  errorHandler: true,         // throws OpencalsApiError on failures (default)
  customerToken: 'eyJ...',    // optional customer JWT for authenticated requests
});
```

## Usage Examples

### Browse Products

```ts
import { customerProductList, customerProductGet } from '@opencals/storefront-sdk';

// List all products
const { data: products } = await customerProductList();

// Get a single product by slug
const { data: product } = await customerProductGet({ path: { slug: 'haircut' } });
```

### Check Availability

```ts
import { customerProductGetCurrentAvailabilities } from '@opencals/storefront-sdk';

const { data } = await customerProductGetCurrentAvailabilities({
  path: { productId: 'prod_123' },
  query: { staffMemberId: 'staff_456', locationId: 'loc_789' },
});
```

### Cart & Checkout

```ts
import {
  cartCreateOrGet,
  cartAddItem,
  checkoutStart,
  checkoutSubmit,
} from '@opencals/storefront-sdk';

// Create or get existing cart
const { data: cart } = await cartCreateOrGet();

// Add item
await cartAddItem({
  body: {
    productId: 'prod_123',
    startAt: '2025-06-15T10:00:00Z',
    staffMemberId: 'staff_456',
    locationId: 'loc_789',
  },
});

// Checkout
const { data: checkout } = await checkoutStart();
await checkoutSubmit({ body: { checkoutId: checkout.id } });
```

### Customer Auth

```ts
import { authSignIn, authSignUp } from '@opencals/storefront-sdk';

// Sign up
await authSignUp({
  body: { email: 'user@example.com', password: '...', firstName: 'Jane', lastName: 'Doe' },
});

// Sign in
const { data } = await authSignIn({
  body: { email: 'user@example.com', password: '...' },
});
// data.accessToken — use as customerToken in setupOpencals()
```

### Helpers

```ts
import { formatPrice, formatDuration, toLocalFromUtc } from '@opencals/storefront-sdk';

formatPrice(4500, 'USD');         // "$45.00"
formatDuration(3600);             // "1h"
toLocalFromUtc('2025-06-15T14:00:00Z', 'America/New_York');
```

## Zod Validation

All API response types have auto-generated Zod schemas for runtime validation:

```ts
import { productListResponseSchema } from '@opencals/storefront-sdk';

const result = productListResponseSchema.safeParse(apiResponse);
```

## API Reference

Full API documentation is available at [api.opencals.com/docs/storefront](https://api.opencals.com/docs/storefront).

## License

MIT
