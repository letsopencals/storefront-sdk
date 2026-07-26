# Changelog

## 0.3.10 (2026-07-26)

- Configurable required customer fields + contact snapshot at checkout:
  - New `StorePublicSettings.checkoutSettings` (`CheckoutSetting`) exposes which customer fields are
    required at checkout: `customerFirstNameRequired` (boolean) plus `customerPhoneRequirement`,
    `customerCompanyNameRequirement`, and `customerCompanyVatNumberRequirement`, each a
    `CheckoutFieldRequirement` (`'hidden' | 'optional' | 'required'`). Last name and email are always
    required. Enforced by the storefront for returning/new customers.
  - New types: `CheckoutSetting`, `CheckoutFieldRequirement`
  - Customer now carries `companyName` / `companyVatNumber`: added to customer responses (checkout,
    order, appointment, self-service profile) and accepted on the writable customer/profile DTOs
    (`NewOrderCustomer`, `ExistingOrderCustomer`, `NewAppointmentCustomer`, `ExistingAppointmentCustomer`,
    `UpdateCustomerProfile`, etc.). Checkout now persists `phone` (previously dropped) alongside the
    company fields.
  - Order/cart responses snapshot the customer contact captured when the order was placed:
    `customerFirstName`, `customerLastName`, `customerEmail`, `customerPhone`, `customerCompanyName`,
    `customerCompanyVatNumber`.
- Regenerated client from updated OpenAPI spec

## 0.3.9 (2026-07-22)

- `ProductService.getCurrentAvailabilitiesMerged()` (availability ranges) accepts an optional
  `duration` query param (booking duration in seconds; defaults to the product base duration).
  Ranges too short to fit the requested duration are omitted — mirrors `getCurrentAvailabilities()`.
- Regenerated client from updated OpenAPI spec

## 0.3.8 (2026-07-18)

- `CheckoutStartResponse` gained `publishableKey`: the Stripe platform publishable key matching the
  connected account's mode (test/live), so the storefront loads Stripe.js with the correct-mode key
- Google Ads click ID (`gclid`) tracking:
  - `SubmitCheckout` accepts optional `trackingData` (new `CheckoutTrackingData` type) to capture the
    `gclid` at checkout
  - Order responses now expose `gclid`: `OrderDetailResponse`, `OrderListItemResponse`, `CheckoutOrder`,
    `AppointmentDetailOrder`
- `ProductService.getCurrentAvailabilities()` accepts an optional `duration` query param (booking
  duration in seconds; defaults to the product base duration)
- Regenerated client from updated OpenAPI spec

## 0.3.7 (2026-07-06)

- Added customer file uploads for file-upload checkout/feedback questions:
  - `CustomerUploadService.presign()` — returns a presigned S3 PUT URL + file id so the browser can
    upload a customer's file directly to S3 (bytes never transit the API)
  - New types: `GenerateUploadUrl`, `GenerateUploadUrlResponse`, `CustomerUploadPresignData`,
    `CustomerUploadPresignResponses`, `CustomerUploadPresignResponse`
  - `CheckoutQuestionAnswer` now accepts an optional `fileIds` array to link uploaded files to the answer
  - Checkout/feedback question `type` unions gained `file-upload`; question responses expose `fileConfig`
    (allowed categories, max size, max files)
- Regenerated client from updated OpenAPI spec

## 0.3.5 (2026-07-05)

- Added `throwOnError` option to `setupOpencals()`: when set, failed requests re-throw as
  `OpencalsApiError` instead of resolving to `{ data: undefined, error }`. Defaults to the client
  default (false), so existing consumers are unaffected.

## 0.3.3 (2026-06-28)

- Added appointment guests support:
  - `AppointmentService.addGuest()` and `AppointmentService.removeGuest()`
  - New types: `AddGuest`, `AppointmentGuest`, `AppointmentGuestDto`
- Added `InvoiceService` with `InvoiceService.list()` for listing invoices on customer orders
  - New types: `Invoice`, `InvoiceListData`, `InvoiceListResponse`, `InvoiceListResponses`
- Regenerated client from updated OpenAPI spec

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
