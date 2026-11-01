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
  errorHandler: true,         // turns failures into OpencalsApiError (default)
  throwOnError: true,         // throw it; otherwise calls resolve to { data: undefined, error }
  customerToken: 'eyJ...',    // optional customer JWT for authenticated requests
  buyerIp: () => '203.0.113.7', // optional, server-side: the buyer's IP (see below)
});
```

### Which API key

One key setting (`apiKey` or `OPENCALS_API_KEY`); pick the kind by where the SDK runs:

| Where the SDK runs | Key | Why |
|---|---|---|
| Browser (widgets, client-side apps) | Public storefront key `sfk_` | Visible to visitors by design. Restrict it to your domains (allowed origins). |
| Server (Next.js server code, API routes, serverless) | Private storefront key `spk_` | Secret: keep it out of browser code (the SDK warns). Can forward the buyer's IP. Optionally pinned to your server IPs. |

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

Every cart and checkout call names its cart with the `X-Cart-Id` header. The examples assume
`setupOpencals({ ..., throwOnError: true })`.

```ts
import { CartService, CheckoutService, AppointmentService, OpencalsApiError } from '@opencals/storefront-sdk';
import type { NewOrderCustomer } from '@opencals/storefront-sdk';

// Create the cart (or fetch the one you stored), then hold a slot in it. Passing `cartId` to
// AppointmentService.create adds the appointment to that cart. Times are UTC.
const { data: cart } = await CartService.createOrGet({ headers: { 'X-Cart-Id': savedCartId ?? '' } });
const cartHeaders = { 'X-Cart-Id': cart.id };

await AppointmentService.create({
  body: {
    slot: {
      productId: 'prod_123',
      fromDate: '2026-06-15',
      fromTime: '10:00:00',
      toDate: '2026-06-15',
      toTime: '11:00:00',
    },
    numberOfAttendees: 1,
    cartId: cart.id,
  },
});

// Customer objects carry a `kind`: 'new' (with email and names) or 'existing' (with `customerId`).
const customer: NewOrderCustomer = { kind: 'new', email: 'john@example.com', firstName: 'John', lastName: 'Smith' };

// 1. Start checkout: attaches the customer, re-checks the cart and creates the payment.
const { data: checkout } = await CheckoutService.start({
  headers: cartHeaders,
  body: { provider: 'stripe', customer },
});

// 2. Card payments: confirm the PaymentIntent in the browser with Stripe.js before submitting.
//    Submitting an unconfirmed payment answers 402 PAYMENT_NOT_AUTHORIZED.
const stripe = await loadStripe(checkout.publishableKey!, { stripeAccount: checkout.stripeAccountId ?? undefined });
const elements = stripe!.elements({ clientSecret: checkout.clientSecret! });
// ...mount a Payment Element from `elements` and let the customer enter their card, then:
const { error, paymentIntent } = await stripe!.confirmPayment({ elements, redirect: 'if_required' });
if (error) throw error; // show error.message, let the customer try again

// 3. Submit: places the order.
const { data: result } = await CheckoutService.submit({
  headers: cartHeaders,
  body: { stripePaymentIntentId: paymentIntent!.id },
});

// Manual payment methods (bank transfer, cash, Stripe invoice) skip step 2 and return
// `paymentInstructions` to show on the thank-you page.
if (result.paymentInstructions?.hostedInvoiceUrl) {
  // link the customer to the hosted invoice
}
```

#### Booking status

Not every booking is confirmed straight away. The store may wait for payment or for its own approval. Treat an
appointment as **awaiting confirmation** when `status === 'pending'` **and** `pendingReason` is set (not `null`):

- `'awaiting_payment'`: confirmed once the order is paid, by `order.paymentDueAt`.
- `'awaiting_approval'`: the merchant decides, by `order.approvalDueAt` (or the start time when that is `null`).

A `pending` appointment with no `pendingReason` is only a hold in a cart, not a booking. Label awaiting bookings
"Awaiting payment" or "Awaiting confirmation" rather than "Confirmed".

Order `paymentStatus` is `'unpaid'`, `'paid'`, `'partially-paid'` or `'voided'`. `voided` means the order was
cancelled before anything was paid, so nothing is due. Cancelled orders and appointments may say why in
`cancelReason`.

#### Checkout errors

Failed calls throw `OpencalsApiError` with the HTTP `status`, the API's `message`, a machine-readable `code` when
the API sends one, and the parsed error `body` for any extra fields:

| Status | `code` | When | What to do |
|---|---|---|---|
| 409 | `CART_ALREADY_CHECKED_OUT` | `start` on a cart that already became an order. `body.orderId` is that order. | Show that order, or start a new cart. |
| 409 | `CART_EXPIRED` | A held slot was released and taken meanwhile. | Start a new cart and pick a time again. |
| 409 | `CHECKOUT_IN_PROGRESS` | Another `start` or `submit` of the same cart is still running. | Keep the cart and retry shortly. |
| 402 | `PAYMENT_NOT_AUTHORIZED` | `submit` with a card payment that isn't authorised (declined, 3-D Secure not completed). `body.paymentStatus` is the provider's status. | No order was placed and the cart is untouched: let the customer confirm the payment again, then submit again. |

```ts
try {
  await CheckoutService.submit({ headers: cartHeaders, body: { stripePaymentIntentId } });
} catch (err) {
  if (err instanceof OpencalsApiError) {
    if (err.code === 'PAYMENT_NOT_AUTHORIZED') {
      // ask the customer to complete or retry the payment
    } else if (err.code === 'CART_ALREADY_CHECKED_OUT') {
      const orderId = err.body?.orderId as string | undefined;
    }
  }
  throw err;
}
```

An expired cart isn't an error by itself: `start` and `submit` re-hold every slot that is still free and carry on.

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
