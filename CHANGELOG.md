# Changelog

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
