# Changelog

## 0.3.2 (2026-06-21)

- Added discount/promo code support:
  - `CartService.applyCode()` and `CartService.removeCode()`
  - New types: `AppliedDiscount`, `ApplyCode`, `CartItemAppliedDiscount`, `OrderLineItemDiscount`, `OrderLineItemDiscountWritable`
- Added passwordless / magic link authentication:
  - `AuthService.requestLoginCode()`, `AuthService.verifyLoginCode()`, `AuthService.resolveLink()`
  - New types: `RequestLoginCode`, `VerifyLoginCode`, `ResolveLinkResponse`
- Regenerated client from updated OpenAPI spec

## 0.3.1 (2026-06-14)

- Fixed `AppointmentAddOn` type which was missing fields due to a backend OpenAPI schema name collision with a DTO (DTO renamed to `CreateAppointmentAddOnDto` on the backend)
- Regenerated client from updated OpenAPI spec

## 0.3.0 (2026-06-14)

- Added add-ons support: `AddonService`, with `CartAddOnItem`, `AppointmentAddOn`, and `OrderAddOnLineItem` types
- Added `StoreService.getStorePublicSettings()` for storefront currency and public store settings
- Regenerated client from updated OpenAPI spec

## 0.2.0 (2026-06-05)

- Grouped SDK methods into `*Service` classes by tag (e.g. `ProductService`, `AuthService`, `CartService`) via `containerName`
- Stripped controller prefix from operation IDs via `methodName` (e.g. `ProductService.list()` instead of `productList()`)
- Fixed `Auth` operations missing from spec (tag collision with admin controller)
- Rewrote README with updated examples and service table
- Regenerated client with updated operationIds (underscore separator)

## 0.1.2 (2026-06-01)

- Renamed `client_secret` to `clientSecret` on `CheckoutStartResponse` and `CheckoutStartResponseWritable`
- Regenerated client from updated OpenAPI spec

## 0.1.1 (2026-06-01)

- Renamed `external_domain` to `externalDomain` on `StorePublicSettings` and `StorePublicSettingsWritable`
- Regenerated client from updated OpenAPI spec

## 0.1.0 (2025-05-30)

Initial release.

- Auto-generated TypeScript client from Opencals Storefront OpenAPI spec
- Runtime Zod validation schemas for all API responses
- `setupOpencals()` for one-line SDK initialization with interceptors
- API key, error handler, and logging interceptors
- Helper utilities: `formatPrice`, `formatDuration`, timezone conversion, time interval merging
- Full support for: products, cart, checkout, customer auth, appointments, orders, feedback
