# @opencals/storefront-sdk

Type-safe TypeScript SDK for the [Opencals](https://opencals.com) Storefront API. Build custom booking websites with real-time availability, cart management, checkout, and customer accounts.

## Install

```bash
npm install @opencals/storefront-sdk
```

## Quick Start

```ts
import { setupOpencals, ProductService } from '@opencals/storefront-sdk';

// Initialize once at app startup
setupOpencals({
  apiKey: 'spk_your_key_here', // on a server; use a public sfk_ key in browser code
});

// Fetch products
const { data } = await ProductService.list();
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
  buyerIp: () => '203.0.113.7', // optional, server-side: the buyer's IP (see below)
});
```

### Which API key

One key setting (`apiKey` or `OPENCALS_API_KEY`); pick the kind by where the SDK runs:

| Where the SDK runs | Key | Why |
|---|---|---|
| Browser (widgets, client-side apps) | Public storefront key `sfk_` | Visible to visitors by design. Restrict it to your domains (allowed origins). |
| Server (Next.js server code, API routes, serverless) | Private storefront key `spk_` | Secret. Rejected when sent from a browser. Can forward the buyer's IP. Optionally pinned to your server IPs. |

Both work with every storefront endpoint. Create them in the Opencals dashboard (Users → your user → API Keys).

### Server-side: forward the buyer's IP

When your server calls the API for its visitors, every request comes from your server's IP, so all visitors share
one rate-limit budget and abuse protection can't tell them apart. With a private key, pass `buyerIp` and the API
counts per buyer instead:

**Next.js:** use the ready-made resolver from `@opencals/storefront-sdk/next`:

```ts
// lib/opencals.ts — import it from your server code (route handlers, server actions, server components)
import { setupOpencals } from '@opencals/storefront-sdk';
import { nextBuyerIp } from '@opencals/storefront-sdk/next';

setupOpencals({
  apiKey: process.env.OPENCALS_API_KEY, // spk_...
  buyerIp: nextBuyerIp,
});
```

`nextBuyerIp` reads `x-real-ip`, else the first `x-forwarded-for` entry (Vercel sets both and overwrites what the
browser sends). It only forwards on mutations (sign-in, cart, checkout), because reading request headers while
rendering a GET would make cached pages dynamic.

**Other frameworks or proxies:** pass your own function. It gets `{ method, url }` and returns the visitor's IP from
the header your host sets, never from the request body:

```ts
setupOpencals({
  apiKey: process.env.OPENCALS_API_KEY,
  buyerIp: ({ method }) => (method === 'GET' ? undefined : currentRequest()?.headers['x-real-ip']),
});
```

The resolver runs for every request; return nothing to skip one (outside a request, background jobs). You can also
set it per call: `headers: { 'X-Opencals-Buyer-Ip': ip }`. The header is ignored with a public key.

## Usage Examples

### Browse Products

```ts
import { ProductService } from '@opencals/storefront-sdk';

// List all products
const { data: products } = await ProductService.list();

// Get a single product by slug
const { data: product } = await ProductService.getBySlug({ path: { slug: 'haircut' } });
```

### Check Availability

```ts
import { ProductService } from '@opencals/storefront-sdk';

const { data } = await ProductService.getCurrentAvailabilities({
  path: { productId: 'prod_123' },
  query: { date: '2026-06-15', staffMemberId: 'staff_456', locationId: 'loc_789' },
});
```

### Cart & Checkout

```ts
import { CartService, CheckoutService, AppointmentService } from '@opencals/storefront-sdk';

// Create appointment
const { data: appointment } = await AppointmentService.create({
  body: {
    slot: {
      productId: 'prod_123',
      fromDate: '2026-06-15',
      fromTime: '10:00:00',
      toDate: '2026-06-15',
      toTime: '11:00:00',
    },
    numberOfAttendees: 1,
  },
});

// Create or get cart, add appointment
const { data: cart } = await CartService.createOrGet();
await CartService.addItem({ body: { appointmentId: appointment.id } });

// Checkout
const { data: checkout } = await CheckoutService.start({
  body: { provider: 'stripe', customer: { email: 'john@example.com' } },
});
await CheckoutService.submit();
```

### Customer Auth

```ts
import { AuthService } from '@opencals/storefront-sdk';

// Sign up
await AuthService.signUp({
  body: { email: 'user@example.com', password: '...', firstName: 'Jane', lastName: 'Doe' },
});

// Sign in
const { data } = await AuthService.signIn({
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

## Available Services

| Service | Methods |
|---------|---------|
| `ProductService` | `list`, `get`, `getBySlug`, `getByExternalId`, `getCurrentAvailabilities`, `getCurrentAvailabilitiesMerged`, `getNearestAvailability` |
| `AuthService` | `signIn`, `signUp`, `oauth`, `refresh`, `requestPasswordReset`, `resetPassword`, `requestEmailVerification`, `verifyEmail` |
| `CartService` | `get`, `createOrGet`, `addItem`, `removeItem`, `extendExpiration` |
| `CheckoutService` | `start`, `submit`, `saveCustomer`, `saveAnswers`, `getCartQuestions` |
| `AppointmentService` | `list`, `find`, `create`, `cancel`, `reschedule`, `feedback`, `getBookingPreferences` |
| `OrderService` | `list`, `find` |
| `SelfService` | `getProfile`, `updateProfile`, `changePassword` |
| `LocationService` | `list`, `get`, `getBySlug` |
| `StaffMemberService` | `list`, `getBySlug` |
| `PaymentService` | `getAvailableProviders`, `getSettings` |
| `StoreService` | `getStorePublicSettings` |
| `ProductCollectionService` | `list`, `getBySlug` |
| `ImageService` | `get` |
| `CheckoutQuestionService` | `listTranslations` |
| `FeedbackQuestionService` | `listTranslations` |

## Zod Validation

All API response types have auto-generated Zod schemas for runtime validation:

```ts
import { zProductListResponse } from '@opencals/storefront-sdk';

const result = zProductListResponse.safeParse(apiResponse);
```

## API Reference

Full API documentation is available at [api.opencals.com/docs/storefront](https://api.opencals.com/docs/storefront).

## License

MIT
