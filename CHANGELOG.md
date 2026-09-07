# Changelog

## 0.3.14 (2026-09-07)

### Breaking

Per-line money fields were replaced with a single, exact naming scheme. Update any code that reads
per-line totals — the removed fields are no longer returned:

- **Removed** cart item `lineSubtotal` / `lineTax`.
- **Removed** order line item and add-on line item `subtotal` / `total`.
- **Migration:** use the new fields below — order/cart line `subtotal` → `discountedSubtotal`, order/cart
  line `total` → `discountedTotal`, `lineSubtotal` → `discountedSubtotal` (+ `addOnSubtotal`), `lineTax`
  → `totalTax` (+ `addOnTotalTax`).
- Order- and cart-level aggregate `subtotal` / `total` / `totalTax` are unchanged.

### Fixed

- **Fixed-amount and credit discounts on multi-quantity lines.** A fixed-amount discount (including a
  credit-balance code) applied to a line with `quantity > 1` was applied per unit, over-discounting the
  line (a £100 credit zeroed a 3 × £75 = £225 line) while under-draining the credit balance. Discounts
  now apply against the whole line, so a £100 credit covers exactly £100 of £225.

### Added

Exact, whole-line money fields on every line item and add-on line item (cart and order):

- `originalSubtotal` — original subtotal across all quantities, before discount.
- `totalDiscount` — exact total discount applied to the line.
- `discountedSubtotal` — exact net subtotal (originalSubtotal − totalDiscount), before tax.
- `discountedTotal` — discounted total, including tax when not already in the price.
- `totalTax` on cart items; `addOnSubtotal` / `addOnTotalTax` on cart/order line items.

### Changed

- `discountedUnitPrice` and `unitTaxAmount` are documented as **approximate** per-unit display values
  (they may not divide the exact line total evenly). Use the whole-line fields above for exact amounts.
- Regenerated client types and zod schemas from the updated OpenAPI spec.

## 0.3.13 (2026-08-29)

### Added

- **Credit discount fields on cart discount responses:** `creditCovered`, `creditRemaining` and
  `creditValueType`, plus the `time` discount value type.
- **`no_payment_required` payment provider + `none` checkout mode.** The payment-provider catalog is
  now amount-aware: a fully-discounted or sub-minimum cart returns a single `no_payment_required`
  provider (`checkoutMode: 'none'`), which the storefront renders as a "Confirm booking" step with no
  card entry. `PaymentProviderName` and the checkout-start `provider` field gain this value.

- Regenerated client types and zod schemas from the updated OpenAPI spec.

## 0.3.12 (2026-08-08)

### Breaking

- **Company name / VAT moved off the customer into a billing address.** `companyName` and
  `companyVatNumber` are no longer top-level fields on the writable customer DTOs
  (`NewOrderCustomer`, `ExistingOrderCustomer`, `UpdateCustomerProfile`, etc.) nor on the `Customer`
  response. They now live on a new optional `billingAddress` object (Shopify-style: the billing
  address owns business identity):
  - `billingAddress`: `{ firstName?, lastName?, companyName?, companyVatNumber?, addressLine1?,
    addressLine2?, city?, state?, postalCode?, country? }` — all optional; accepted on the writable
    customer DTOs and persisted to the customer's address book.
  - Migration: send company/VAT under `customer.billingAddress` instead of at the customer level.

### Added

- **Optional billing address at checkout.** The submitted billing address is snapshotted onto the
  cart and order (`billing*` fields on cart/order responses) and saved to the customer's reusable
  address book.
- **New checkout setting `customerBillingAddressRequirement`** (`CheckoutFieldRequirement`:
  `'hidden' | 'optional' | 'required'`) on `StorePublicSettings.checkoutSettings`, governing the
  billing-address street fields. When `required`, address line 1, city, postal code and country are
  mandatory. The existing `customerCompanyNameRequirement` / `customerCompanyVatNumberRequirement`
  now govern the company / VAT sub-fields of the billing address.

- Regenerated client from updated OpenAPI spec

## 0.3.11 (2026-08-01)

- Custom attributes on appointments:
  - `CreateAppointment` accepts an optional `customAttributes` — a flat map of string keys to string
    values (`Record<string, string>`) for attaching arbitrary data (booking source, party size,
    external reference, small JSON strings, etc.) at creation time. Max 250 entries; keys up to 255
    chars, values up to 5000 chars.
  - Appointment responses now echo `customAttributes`.
- Regenerated client from updated OpenAPI spec

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
