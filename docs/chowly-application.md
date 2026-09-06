# Chowly — Application Document

Chowly is an in-restaurant platform: a visiting customer browses the menu, places an
order and watches the wait; a waiter picks the order up, records the chef and bartender
who prepared it and marks it served; if it runs late the customer files a complaint and
a low rating; and payment is taken on the platform before the customer leaves.

This document covers how it was built, how AI was used, what the application does at
every step of that story, and how a stranger can use the deployed link.

---

## 1. How it was built

### 1.1 Stack

| Layer     | Choice | Why |
|-----------|--------|-----|
| Database  | PostgreSQL | Relational data with hard foreign keys and enum-constrained status columns; the model from the first assignment is relational. |
| API       | Node + Express, `pg` | Small, explicit JSON API. No ORM — the queries are short and readable. |
| Sessions  | `express-session` + `connect-pg-simple` | The Customer/Waiter switch is a role kept in a signed cookie; the session store lives in Postgres so it survives a server restart on the host. |
| Client    | React + Vite + Tailwind CSS | Single-page app. Tailwind carries a small "fine dining" design system (cream ground, terracotta accent, a serif display face). |
| Hosting   | Render, then Vercel | First deployed on Render (one web service + Render Postgres); Vercel added afterwards because Render's free tier is slow to wake from idle. See 1.5. |

There is no login. The brief only asks for "a way to act as the customer and as the
waiter", so the app has a **Customer / Waiter** toggle in the header and nothing more.

### 1.2 Structure

```
db/
  00_create_role_and_db.sql   one-time: a low-privilege role + the database
  schema.sql                  11 tables, 4 enum types, indexes (idempotent)
  seed.sql                    2 venues, 30-item menu, staff, 4 sample orders
  menu_images.sql             optional UPDATEs that set menu_item.image_url
  setup.mjs                   pg-driver loader: schema -> seed -> images
api/serverless.js  Vercel entry - the Express app behind one function
server/       Express JSON API (also serves the built client on Render)
  src/app.js                  the Express app (routes, session, SPA serving)
  src/index.js                app.listen() for Render / local
  src/bootstrap.js            first-boot: load schema/seed if the DB is empty
  src/db.js                   one pg Pool + a query() helper
  src/config.js               the active RESTAURANT_ID, the bar-vs-kitchen split
  src/middleware.js           requireCustomer / requireWaiter guards
  src/routes/session.js       /api/me, /api/session/*
  src/routes/menu.js          /api/menu, /api/staff
  src/routes/orders.js        placing, assigning, serving, complaint, rating, payment, lookup
client/       Vite + React SPA
  public/menu/                dish photo files, served at /menu/<file>
  src/context/    SessionContext (role + identity), CartContext (in-progress order)
  src/pages/      LandingPage, MenuPage, OrderLookup, OrderTrackingPage, WaiterDashboard
  src/components/ Header, Logo, RoleToggle, CartButton, CartDrawer, CategorySidebar,
                  MenuItemCard, TableSelect, WaitCountdown, PrepTeam, StatusBadge,
                  PretendBadge, Stars, OrderPanels, OrderSummary
  src/lib/        format (naira / times), categories, tables (1–20)
render.yaml     Render blueprint (Postgres + web service)
vercel.json     Vercel config (static SPA + /api/* -> the function)
docs/           this document
```

In development `npm run dev` runs the API on `:3000` and the Vite dev server on `:5173`,
with Vite proxying `/api` to Express. In production `npm run build` compiles the client
to `client/dist` and Express serves it with an SPA fallback, so the whole app is one
origin.

### 1.3 API surface

All JSON, under `/api`. The current role lives in a signed session cookie
(`express-session` + a Postgres-backed store); there is no login.

| Method & path | Role | Purpose |
|---|---|---|
| `GET /api/health` | any | liveness check (no DB) — the Render health check |
| `GET /api/health/db` | any | DB round-trip check (`SELECT now()`) |
| `GET /api/me` | any | active role, customer identity, current order, venue |
| `POST /api/session/customer` | any | create the `customer` row, become a customer |
| `POST /api/session/role` | any | flip the Customer/Waiter view (keeps identity) |
| `POST /api/session/switch` | any | full reset — forget identity and current order |
| `GET /api/menu` | any | available items for the venue (incl. `image_url`) |
| `GET /api/tables` | any | tables that currently have an order in progress |
| `GET /api/staff` | waiter | waiter / chef / bartender lists for the dropdowns |
| `POST /api/orders` | customer | place an order (transaction; price snapshot; wait estimate) |
| `POST /api/orders/lookup` | any | find an order by name + table, resume the session on it |
| `GET /api/orders/:id` | any | full order detail (items, staff, payment, complaint, rating) |
| `GET /api/waiter/orders` | waiter | the board: every order + items, total, payment method, open complaint |
| `POST /api/orders/:id/assign` | waiter | record waiter/chef/bartender → `preparing`, stamp prep start |
| `POST /api/orders/:id/serve` | waiter | → `served`, stamp `served_at`, `actual_wait_minutes`, prep end |
| `POST /api/orders/:id/complaint` | customer | file a complaint against the order |
| `POST /api/orders/:id/rating` | customer | 1–5 rating + comment (upsert on `order_id`) |
| `POST /api/orders/:id/pay` | waiter | record a pretend payment (`cash`/`card`/`transfer`) → `paid` |
| `POST /api/complaints/:id/resolve` | waiter | close a complaint, record `resolved_by_waiter_id` |

### 1.4 The data model as finally implemented

The first assignment's model was graded 92/100. The assessor asked for three additions,
and building the app forced three more. All six are in `db/schema.sql`:

| # | Change | Reason |
|---|--------|--------|
| 1 | New **`restaurant`** table; every operational row has a `restaurant_id`. | Feedback: the story frames Chowly as an app *adopted by* restaurants, so the model must be multi-tenant. |
| 2 | **`prep_start_time` / `prep_end_time`** on `order_item`. | Feedback: a per-item delay should be provable from the data alone. The waiter's "assign" stamps the start, "mark served" stamps the end. |
| 3 | **`received_by_waiter_id`** on `payment`, **`resolved_by_waiter_id`** on `complaint`. | Feedback: the staff side of payment and complaint resolution should be traceable. |
| 4 | **`table_number` moved** from `customer` to `orders`. | A table belongs to a single visit, not permanently to a person. |
| 5 | **`unit_price_naira` snapshot** on `order_item` (with `subtotal_naira` a generated column). | Historical order totals must not move when a menu price is later edited. |
| 6 | Nullable **`image_url`** on `menu_item`. | The menu card shows a dish photo when set, and a category-tinted band when not. Photos are populated separately in `db/menu_images.sql`. |

The eleven tables: `restaurant`, `customer`, `menu_item`, `waiter`, `chef`, `bartender`,
`orders`, `order_item` (the Order↔MenuItem bridge), `payment`, `complaint`, `rating`.
Four enum types constrain the status columns (`menu_category`, `order_status`,
`payment_status`, `complaint_status`). One more table, `session`, is created at runtime
by `connect-pg-simple` to hold the role cookie — it is not part of the model.

The seed (`db/seed.sql`) loads two venues, a 30-item Nigerian menu for the active venue,
the staff lists, and four sample orders whose numbers reconcile: order 1's items total
₦16,000 = its payment; order 4's total ₦5,000 = its payment; order 2 is past its 20-minute
estimate with an open complaint and a 1-star rating.

> Note: the seeded orders carry their original August dates, so a wait measured against
> "now" is nonsensically large. The UI hides that (it shows "Running late" / "Served"
> without the number once past ~6 hours); fresh orders you place yourself show real times.

### 1.5 Deployment

The application was **first deployed on Render** — a single free Node web service
(serving the SPA and the API together) plus a free Render Postgres instance, wired up by
`render.yaml`. That deployment works, but Render's free web service **sleeps after ~15
minutes idle** and takes **roughly 50 seconds** to wake on the next request, so a
facilitator opening a cold link would sit on a blank page for the best part of a minute.

To fix that, a **second deployment was added on Vercel**, from the same repository. On
Vercel the static SPA is served straight from the CDN (instant) and the API runs as one
serverless function that cold-starts in a fraction of a second against Neon (serverless
Postgres). Vercel is therefore the link to use; Render is kept as a fallback and to show
the same code runs unchanged as a long-lived server.

| Order | Platform | Database | Serves |
|---|---|---|---|
| 1st (fallback) | **Render** | Render Postgres | one Node web service — SPA + API |
| 2nd (use this)  | **Vercel** | Neon (serverless Postgres) | SPA on the CDN; API as one serverless function |

Adding Vercel meant factoring the Express app into `server/src/app.js` (the app) plus two
thin entry points: `server/src/index.js` still calls `app.listen()` for Render and local
use; `api/serverless.js` exports the same app as a Vercel function.
`server/src/bootstrap.js` loads `schema.sql`, `seed.sql` and `menu_images.sql` the first
time the app runs against an empty database (checked via the `menu_item` table; a no-op
once it exists), so neither platform needs a shell for the initial data load. `db.js`
enables SSL when `NODE_ENV=production`, and the session cookie is `secure` behind both
platforms' HTTPS.

**Render** (`render.yaml`): a free Postgres instance and a free Node web service in the
same region; `DATABASE_URL` from the database, `SESSION_SECRET` generated,
`NODE_ENV=production`, health check on `/api/health` (a DB-free liveness check). The
build command runs `npm install --include=dev` for the client — Render sets
`NODE_ENV=production` during the build, which otherwise skips Vite/Tailwind and the
build fails with "vite: not found".

**Vercel** (`vercel.json`): `client/` is built and served as static output;
`/api/*` is rewritten to the `api/serverless.js` function; everything else falls back to
`index.html`. The Neon database is created from the Vercel dashboard (Storage → Create
Database → Neon — no separate Neon account), which injects a family of connection vars;
`db.js` takes an explicit `DATABASE_URL` if present and otherwise scans the environment
for the best `postgres://` URL (preferring the pooled, TLS one), so the integration's
generated names work as-is. `SESSION_SECRET` is added by hand; `NODE_ENV=production` is
automatic.

To reset or reload either database by hand, run `node db/setup.mjs` from a laptop against
that database's connection string. Step-by-step instructions for both are in `README.md`.

---

## 2. How AI was used

The build was done with an AI coding assistant (Claude, via Claude Code).

**What it was asked to do**
- Read the three source documents (the build brief, the original model, the assessment
  feedback) and the three SQL files, then propose a staged plan.
- Scaffold the repo, write the Express API route by route, and build the React client
  screen by screen, styled after a Figma Make "fine dining" design.
- Deliver the work as a readable sequence of git commits, then apply a long run of small
  follow-up changes (below), each as its own commit.

**What was accepted**
- The overall shape: `client/` + `server/` split, the session role switch, the API
  surface, the Tailwind design tokens lifted from the Figma design.
- The transactional order-placement query, the parallel `max(kitchen, bar)` wait
  estimate, and the `ON CONFLICT (order_id)` rating upsert.
- A decision to reset the messy early git history to a clean, staged commit sequence
  (the pre-reset history is kept on the `archive/pre-rebuild` branch).
- Later feature requests taken as-is: a welcome landing page; order lookup by name +
  table; a live MM:SS countdown; the logo linking home; the table picker as a 1–20
  dropdown; the waiter opening a paid card for a full summary; a second deployment on
  Vercel (factoring the Express app so one copy runs both as a server and as a function).

**What was rejected or corrected**
- The first pass had the role toggle **wipe the customer's session** on every switch,
  so a customer who peeked at the waiter view lost their order. Changed so the toggle
  only flips the view and keeps identity + current order; a separate "start a new order"
  action is the explicit reset.
- `db/setup.mjs` first shelled out to `psql`, which a Render shell does not have.
  Rewritten to run the `.sql` files through the `pg` driver (stripping the `psql`-only
  `\echo` / `\gexec` lines).
- The off-canvas cart drawer widened the page (horizontal scroll) until `overflow-x`
  was clipped on the body; the order item table had to be made to scroll inside its
  card on mobile.
- Payment was first allowed from either role. Corrected to **waiter-only**, with the
  waiter choosing the method the guest used.
- The seed's historical dates made "actual wait" read as hundreds of hours; the UI now
  suppresses the number past ~6 hours.
- `image_url` on `menu_item` was initially left out to keep the SQL files untouched;
  when photos were wanted it was added to `schema.sql`, with the actual URLs kept in a
  separate `db/menu_images.sql` so the seed file stays close to what was supplied.
- Small UX fixes on request: reloading the menu no longer bounces to the welcome page;
  the "back to your order" button was removed from the welcome page.
- The first Render deploy failed (the build skipped the client's dev dependencies) and
  the mobile layout zoomed out because a grid track blew past the viewport width; both
  were found by testing the deployed build rather than by review.

---

## 3. What the application does, step by step

### Welcome screen
Opening the app shows a short welcome page for the active venue — its name and address,
a one-line explanation of how ordering works, and a **View the menu** button. It is shown
only to a fresh customer; someone with an order still in progress (not yet paid) goes
straight to their tracking screen, and the waiter view skips it entirely. Once the customer taps
**View the menu** the tab remembers it (session storage), so reloading mid-browse stays
on the menu rather than bouncing back here.

### Menu browsing
**View the menu** opens the menu for the active venue — every available item, with a
`BROWSE` sidebar listing **All** and the five categories (Starters, Main Courses, Sides,
Desserts, Drinks) with a live count each. Each card shows the preparation time, the price
in naira, the name, a short description, and a dish photo where one is set (a
category-tinted band otherwise). No identity is needed to browse.

### Order placement
`+ Add to Order` puts an item in the cart (the header shows the count). Opening the cart
lists the lines with quantity steppers and a running total. **Continue** asks for a name
(optional) and the **table** (a dropdown of tables 1–20, required); **Place order** then:
1. creates the `customer` row and stores the identity in the session;
2. inserts the `orders` row (`status = 'pending'`) and one `order_item` per line, each
   with a snapshot of the current price;
3. sets the order's **estimated wait** to `max(sum of kitchen prep times, sum of bar
   prep times)` — the kitchen and bar work in parallel.

**One open order per table.** The checkout dropdown greys out any table that already has
an order in progress (`GET /api/tables`). If one is chosen anyway — or taken between
loading the form and submitting — the order is refused with a 409 and the cart offers a
link straight to that current order. A new order can only be placed at the table once
the previous one is paid.

The customer lands on the **order tracking** screen: status, a live **MM:SS countdown**
to the estimated ready time (which flips to "running late" once the estimate is passed,
then to "served in N min" afterwards), the itemised list with the total, and "who's
handling this" (empty until a waiter picks it up). The screen polls every 5 seconds and
survives a page refresh.

A customer who has lost their session (closed the tab, or is on another device) can get
back to this screen from the welcome page — **"Already ordered? Check your order status"**
asks for the **name and table** used on the order (case-insensitive match on the most
recent one) and reopens its tracking screen.

### Order assignment
Switching to **Waiter** shows the order board, sorted `pending → preparing → served →
paid`. Every card lists the ordered items with their subtotals and the order total.

A **pending** order has three dropdowns — **waiter, chef, bartender** — filled from the
seeded staff lists. **Confirm assignment** records the three on the order, moves it to
`preparing`, and stamps `prep_start_time` on every item. A **preparing** order shows the
assigned team and a **Mark served** button, which sets `status = 'served'`, `served_at`,
`actual_wait_minutes`, and `prep_end_time` on every item.

A **paid** card is collapsible: opening it fetches the full order and shows a summary —
placed / served / paid times, the prep team, the itemised bill, the **payment (amount,
method, time)** with the pretend badge, and any complaint (with its resolution) and
rating.

### Complaint and rating
While an order is active the customer sees a **"Taking too long?"** box. Submitting it
stores a `complaint` (status `open`) against the order; it then shows on the order for
the customer and as a red **complaint** flag with the text on the waiter's board, where
**Mark complaint resolved** closes it and records `resolved_by_waiter_id`. Once the order
is served (or paid) the customer can leave a **1–5 star rating** with an optional comment;
re-rating replaces the previous one.

### Payment
Payment is taken by the **waiter** on the served order — the customer's screen only shows
the total and a note that the waiter will collect it. On the board the waiter picks the
method the guest used (**cash / card / transfer**) and confirms; that inserts a `payment`
row (`is_pretend = TRUE`, amount from the item subtotals, `received_by_waiter_id` = the
order's waiter, `method` = the chosen one) and moves the order to `paid`. Both screens
then show the paid amount with a clear **"PRETEND PAYMENT — NO REAL MONEY MOVED"** badge.

Everything above is stored in PostgreSQL — refreshing any screen reloads the same state.

---

## 4. How to use the deployed link

Use the **Vercel** link — it loads instantly. The **Render** link works identically but,
on the free tier, takes ~50 seconds to wake if it has been idle.

1. **Open the link.** You land on the venue's welcome screen — click **View the menu**.
2. **Browse.** Use the `BROWSE` sidebar to filter by category.
3. **Order.** Add a few items, open the cart (top-right), **Continue**, pick your table
   from the dropdown, **Place order**. You are now on the tracking screen with a wait
   estimate.
4. **Be the waiter.** Click **Waiter** in the header. Each order card lists its items.
   Find your order (it is `pending`), pick a waiter, chef and bartender, **Confirm
   assignment**. The order is now `preparing`. Click **Mark served**.
5. **Take payment (waiter).** On the served order pick how the guest paid — **Cash /
   Card / Transfer** — and click **Take … payment**. The order is now `paid`.
6. **Back to the customer.** Click **Customer** — the order shows as paid with the
   pretend-payment badge. (Optional: before serving, use "Taking too long?" to file a
   complaint, then resolve it from the waiter board.)
7. **Rate.** Leave a star rating and a comment.
8. **Start over.** "Start a new order" clears the visit so the next person can begin fresh.

The **Customer / Waiter** switch in the header is the only thing you need to move between
the two roles — there is no login. Clicking the **Chowly** logo (top-left) always returns
to the welcome page.
