# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
composer dev          # Start all dev servers concurrently (PHP, queue, Vite)
composer dev:ssr      # Start with SSR support (builds SSR first, then starts all)
```

### Build
```bash
npm run build         # Build frontend assets
npm run build:ssr     # Build client + SSR bundles
```

### Testing
```bash
composer test                           # Run PHP lint check + all tests
php artisan test                        # Run all PHP tests
php artisan test --filter=TestName      # Run a single test
php artisan test tests/Feature/Auth/AuthenticationTest.php  # Run a specific file
```

### Linting & Formatting
```bash
composer lint         # Fix PHP code style (Laravel Pint)
composer lint:check   # Check PHP style without fixing
npm run lint          # Fix JS/TS ESLint issues
npm run lint:check    # Check JS/TS without fixing
npm run format        # Format frontend files with Prettier
npm run format:check  # Check formatting without fixing
npm run types:check   # TypeScript type checking (no emit)
```

### CI Check (runs all checks)
```bash
composer ci:check     # lint:check + format:check + types:check + tests
```

## Architecture

This is a **Laravel 12 + React + Inertia.js** e-commerce application (Taobao reseller storefront) using Fortify for authentication and a Laravel Modules structure for domain separation.

### Roles
- **admin** — accesses `/admin` panel (product/category/order management)
- **customer** — accesses storefront (`/shop`, `/cart`, `/checkout`, `/orders`)
- Guest users can browse and add to cart; checkout requires auth + `customer` role
- Login/register redirect to `/shop` for customers, `/admin` for admins (`FortifyServiceProvider`)

### Module Structure (`Modules/`)
Each module lives in `Modules/{Name}/` with its own `app/`, `database/`, and `routes/`.

| Module | Responsibility |
|---|---|
| **Catalog** | Products, categories, attributes, variants, shop/home pages |
| **Ordering** | Cart, checkout, orders. Session-based guest carts via `CartService::resolveCart()` |
| **Currency** | `CurrencyService::rmbToIdr()` — all prices stored in CNY (RMB), displayed in IDR |
| **Payment** | Midtrans Snap integration (`PaymentService::createSnapToken()`) |
| **Admin** | Admin dashboard, hero slides, shop settings, exchange rates |
| **Core** | Shared base module scaffolding |

### Cart System
Cart items support **two modes** — always check both when reading/writing:
- **Variant items**: `product_variant_id` set, `product_id` null
- **Direct product items**: `product_id` set, `product_variant_id` null (for products with no variants)

`CartController::store()` accepts either `product_variant_id` or `product_id`. `ShippingService` and `CartService` use null-safe operators (`?->`) throughout.

### Product Images
Products use **Spatie MediaLibrary** with the `images` collection and `thumb` conversion. The `thumbnail` DB column may be null — always fall back:
```php
$product->thumbnail ?? ($product->getFirstMediaUrl('images', 'thumb') ?: $product->getFirstMediaUrl('images') ?: null)
```
Eager-load `media` alongside products in every controller that renders product listings.

### Translations
- Product names/descriptions: stored in `ProductTranslation` model (locale + `product_id`)
- UI strings: i18next with `resources/js/i18n/locales/{en,id}.json`
- Controllers resolve locale via `app()->getLocale()` and fall back to `'en'`
- Product descriptions contain HTML — use `dangerouslySetInnerHTML` in React; strip tags with `.replace(/<[^>]*>/g, '')` for plain-text previews

### Backend (PHP/Laravel)
- **`app/`** — Core app: Fortify actions, Settings controllers, User model
- **`app/Providers/FortifyServiceProvider.php`** — Auth redirects by role
- **`routes/web.php`** — Public + cart routes (guest-accessible); checkout/orders require `auth + role:customer`
- **`routes/settings.php`** — Profile, password, appearance, 2FA

### Frontend (TypeScript/React)
All frontend code lives in `resources/js/`. The `@/` alias maps to `resources/js/`.

- **`pages/`** — Inertia page components. Key pages: `home.tsx`, `shop.tsx`, `products/show.tsx`, `cart/index.tsx`, `checkout/index.tsx`, `orders/`
- **`layouts/customer-layout.tsx`** — Storefront shell with nav, cart icon, language switcher
- **`layouts/`** — Also contains `app-layout.tsx` (admin), `auth-layout.tsx`
- **`components/product-card.tsx`** — Shared product card used on home and shop pages
- **`components/ui/`** — Shadcn-style primitive UI components built on Radix UI + Tailwind
- **`hooks/use-cart.ts`** — `addItem(variantId, qty)` and `addProduct(productId, qty)` via Inertia router POST
- **`hooks/use-currency.ts`** — IDR formatting
- **`actions/`** — Auto-generated Wayfinder files (do not edit — run `php artisan wayfinder:generate` after route changes)
- **`types/`** — TypeScript type definitions
- **`lib/utils.ts`** — `cn()` for merging Tailwind classes

### Key Integrations
- **Inertia.js**: PHP controllers pass props via `Inertia::render()`. No separate API layer.
- **Fortify**: All auth flows (login, register, 2FA, password reset).
- **Spatie Permission**: Role-based middleware (`role:admin`, `role:customer`).
- **Spatie MediaLibrary**: Product image storage with conversions.
- **Sonner**: Toast notifications — already mounted in `app.tsx`, import `toast` from `'sonner'`.
- **Midtrans**: Payment gateway via Snap token flow.
- **Tailwind CSS v4**: Configured via Vite plugin, no `tailwind.config.js`.
- **React Compiler**: Enabled via `babel-plugin-react-compiler` in Vite config.

### Testing
- Uses **Pest** (v4) with `pest-plugin-laravel`
- Tests use in-memory SQLite (`DB_DATABASE=:memory:`)
- Feature tests in `tests/Feature/`, unit tests in `tests/Unit/`
