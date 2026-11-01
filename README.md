# Geo — MERN E-Commerce Platform

Full-stack storefront and admin dashboard for **Geo**, a modern home-goods shop.

**Stack:** React (Vite) + NestJS + MongoDB — MERN with NestJS instead of Express for a modular, scalable API.

## Features

### Customer storefront
- Homepage with promotional banners, categories, and featured products
- Searchable, filterable, sortable product listings and product detail pages
- Auth: register, login, logout, profile
- Cart, wishlist, addresses, orders, promo codes, checkout
- Order detail and return requests (delivered orders)

### Admin dashboard
- Role-protected sidebar layout
- Overview metrics (revenue, orders, customers, low stock, open returns)
- Manage products (incl. images/stock), categories, coupons, banners, settings
- Order status updates and return-request decisions

### Backend guarantees
- JWT httpOnly cookie auth + refresh rotation
- Customers can only access their own account data and orders
- Server recomputes prices, stock, coupon eligibility, shipping, tax, and totals (never trusts client totals)
- Modular `PaymentGateway` with a simulated provider for local demos

## Project structure

```
ecommerce-app/
├── client/                 # React + Vite storefront & admin UI
├── server/                 # NestJS REST API
│   ├── src/
│   │   ├── auth/           # Login, register, JWT strategy
│   │   ├── users/          # Profile
│   │   ├── addresses/
│   │   ├── categories/
│   │   ├── products/
│   │   ├── coupons/
│   │   ├── banners/
│   │   ├── carts/          # Server-priced cart
│   │   ├── wishlists/
│   │   ├── checkout/       # Order create + payment confirm
│   │   ├── orders/
│   │   ├── returns/
│   │   ├── settings/
│   │   ├── admin/          # Metrics
│   │   ├── payments/       # PaymentGateway + SimulatedPaymentGateway
│   │   └── uploads/
│   └── scripts/seed.ts
├── docker-compose.yml      # MongoDB 7
└── .env.example
```

## Prerequisites

- Node.js 20+
- Docker (for MongoDB)
- npm

## Setup

```bash
# 1. Start MongoDB (single-node replica set — required for checkout transactions)
docker compose up -d
# Wait until healthy (replica set init via healthcheck), ~10–20s on first run

# 2. API env
cp server/.env.example server/.env
# Edit JWT_SECRET to a long random string before any real deployment
# MONGODB_URI must include ?replicaSet=rs0 for local Docker

# 3. Install & seed
cd server && npm install && npm run seed && cd ..
cd client && npm install && cd ..
```

### Demo accounts (seed)

| Role     | Email                   | Password       |
|----------|-------------------------|----------------|
| Admin    | `admin@geo.shop`        | `Password123!` |
| Customer | `customer@example.com`  | `Password123!` |

Promo codes: `WELCOME10` (10% off, min $50), `FREESHIP` ($7.99 off shipping-equivalent discount).

## Run locally

```bash
# Terminal 1 — API (http://localhost:3000/api)
cd server && npm run start:dev

# Terminal 2 — Client (http://localhost:5173)
cd client && npm run dev
```

The Vite dev server proxies `/api` and `/uploads` to the NestJS server so auth cookies stay first-party.

## Deploy (free demo)

Recommended free stack for sharing a live demo:

| Piece | Free service |
|-------|----------------|
| Database | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) M0 |
| App (API + storefront) | [Render](https://render.com) free Web Service |

The production build serves the React app from NestJS on **one URL**, so login cookies work without cross-site setup.

### 1. MongoDB Atlas
1. Create a free M0 cluster.
2. Database Access → create a user.
3. Network Access → allow `0.0.0.0/0` (demo only) or Render’s IPs.
4. Connect → Drivers → copy the URI, e.g.  
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/geo?retryWrites=true&w=majority`

### 2. Render
1. Push this branch to GitHub.
2. Render → **New** → **Blueprint** → select the repo (uses [`render.yaml`](render.yaml)), **or** New Web Service manually:
   - **Build:** `npm run build:deploy`
   - **Start:** `npm run start:deploy`
3. Set environment variables:
   - `MONGODB_URI` — Atlas URI from step 1
   - `CLIENT_ORIGIN` — your Render URL, e.g. `https://geo-ecommerce.onrender.com`  
     (or omit it; the app falls back to `RENDER_EXTERNAL_URL`)
   - `JWT_SECRET` — long random string (Blueprint can auto-generate)
   - `NODE_ENV=production`
4. Deploy, then open **Shell** on the service and seed demo data:

```bash
npm run seed:deploy
```

5. Open the Render URL. Demo logins are in the table above.

**Notes**
- Free Render services **sleep when idle**; the first visit after sleep can take 30–60 seconds.
- Disk is ephemeral — admin image uploads may disappear after redeploys; seeded Unsplash images are fine for demos.
- Payments stay on the simulated gateway (no Stripe keys required).

## Key database models

| Collection      | Purpose |
|-----------------|---------|
| `User`          | Email, password hash, role (`CUSTOMER` / `ADMIN`) |
| `Address`       | Saved shipping addresses per user |
| `Category`      | Catalog categories (slug) |
| `Product`       | SKU, price (cents), stock, images, category |
| `Coupon`        | Percent/fixed promos with limits and windows |
| `Banner`        | Homepage promotional banners |
| `Cart`          | One open cart per user + optional coupon |
| `WishlistItem`  | User ↔ product |
| `Order`         | Line snapshots, totals, status, payment ref |
| `ReturnRequest` | Customer return workflow |
| `StoreSetting`  | Store name, currency, shipping, tax |

Money is stored as **integer cents**. Currency, flat shipping, free-shipping threshold, and tax rate live in store settings.

## Important API routes

Base path: `/api`

| Area | Routes |
|------|--------|
| Auth | `POST /auth/register`, `/login`, `/logout`, `/refresh`; `GET /auth/me` |
| Catalog | `GET /products`, `/products/:slug`, `/categories`, `/banners`, `/settings` |
| Cart | `GET /cart`; `POST/PATCH/DELETE /cart/items…`; `POST/DELETE /cart/coupon` |
| Wishlist | `GET/POST /wishlist`; `DELETE /wishlist/:productId` |
| Account | `GET/PATCH /account/profile`; address CRUD under `/account/addresses` |
| Checkout | `POST /checkout` → `POST /checkout/:orderId/confirm` |
| Orders | `GET /orders`, `/orders/:id`; `POST /orders/:id/returns` |
| Admin | `/admin/metrics`, products, categories, coupons, banners, settings, orders, returns, uploads |

Errors use a consistent shape: `{ "error": { "code": "...", "message": "..." } }`.

## Payments

Checkout uses the `PaymentGateway` interface. Locally, `SimulatedPaymentGateway` always succeeds (except total `$0.13` / `13` cents, which declines for demos).

To add Stripe later: implement the interface, bind it in `PaymentsModule` when `STRIPE_SECRET_KEY` is set. Card data never hits this API.

## Secure defaults

- Guest browse; login required for cart, wishlist, checkout, and account
- One SKU per product (variants deferred)
- Stock decrements only inside the paid-confirm transaction
- Rate limiting via Nest Throttler; Helmet enabled
- Server refuses to boot without `MONGODB_URI` and a `JWT_SECRET` (≥16 chars)
- No secrets committed — use `.env` from examples

## Features deliberately deferred

Product variants, guest checkout, reviews, real email (password reset / order mail), full-text search engine, multi-currency, inventory holds, staff vs admin roles, object storage CDN.

## Scripts

| Command | Where | Description |
|---------|-------|-------------|
| `npm run start:dev` | server | Nest watch mode |
| `npm run seed` | server | Reset and seed demo data |
| `npm run build` | server / client | Production build |
| `npm run dev` | client | Vite dev server |
