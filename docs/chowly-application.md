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
| Hosting   | Render | One managed Postgres instance + one Node web service, wired together by `render.yaml`. |

There is no login. The brief only asks for "a way to act as the customer and as the
waiter", so the app has a **Customer / Waiter** toggle in the header and nothing more.

### 1.2 Structure

```
db/         schema.sql, seed.sql, 00_create_role_and_db.sql, setup.mjs
server/     Express API (also serves the built client in production)
  src/index.js            app wiring, session, static SPA serving
  src/db.js               one pg Pool + a query() helper
  src/config.js           the active RESTAURANT_ID, the bar-vs-kitchen split
  src/middleware.js       requireCustomer / requireWaiter guards
  src/routes/session.js   /api/me, /api/session/*
  src/routes/menu.js      /api/menu, /api/staff
  src/routes/orders.js    everything order-shaped
client/     Vite + React SPA
  src/context/SessionContext.jsx   loads /api/me, exposes role changes
  src/context/CartContext.jsx      the in-progress order
  src/pages/       MenuPage, OrderTrackingPage, WaiterDashboard
  src/components/  Header, RoleToggle, CategorySidebar, MenuItemCard,
                   CartDrawer, WaitCountdown, PrepTeam, OrderPanels, ...
```

In development `npm run dev` runs the API on `:3000` and the Vite dev server on `:5173`,
with Vite proxying `/api` to Express. In production `npm run build` compiles the client
to `client/dist` and Express serves it with an SPA fallback, so the whole app is one
origin.

### 1.3 The data model as finally implemented

The first assignment's model was graded 92/100. The assessor asked for three additions,
and building the app forced two more. All five are in `db/schema.sql`:

| # | Change | Reason |
|---|--------|--------|
| 1 | New **`restaurant`** table; every operational row has a `restaurant_id`. | Feedback: the story frames Chowly as an app *adopted by* restaurants, so the model must be multi-tenant. |
| 2 | **`prep_start_time` / `prep_end_time`** on `order_item`. | Feedback: a per-item delay should be provable from the data alone. The waiter's "assign" stamps the start, "mark served" stamps the end. |
| 3 | **`received_by_waiter_id`** on `payment`, **`resolved_by_waiter_id`** on `complaint`. | Feedback: the staff side of payment and complaint resolution should be traceable. |
| 4 | **`table_number` moved** from `customer` to `orders`. | A table belongs to a single visit, not permanently to a person. |
| 5 | **`unit_price_naira` snapshot** on `order_item` (with `subtotal_naira` a generated column). | Historical order totals must not move when a menu price is later edited. |

The eleven tables: `restaurant`, `customer`, `menu_item`, `waiter`, `chef`, `bartender`,
`orders`, `order_item` (the Order↔MenuItem bridge), `payment`, `complaint`, `rating`.
Four enum types constrain the status columns (`menu_category`, `order_status`,
`payment_status`, `complaint_status`).

The seed (`db/seed.sql`) loads two venues, a 30-item Nigerian menu for the active venue,
the staff lists, and four sample orders whose numbers reconcile: order 1's items total
₦16,000 = its payment; order 4's total ₦5,000 = its payment; order 2 is past its 20-minute
estimate with an open complaint and a 1-star rating.

> Note: the seeded orders carry their original August dates, so if you serve one of them
> during a demo its "actual wait" is measured from that date. Fresh orders you place
> yourself show sane wait times.

### 1.4 Deployment

`render.yaml` is a Render blueprint:

- a free **Postgres** instance (`chowly-db`);
- a free **Node web service** — `buildCommand: npm run build`, `startCommand: npm start`,
  health check on `/api/health`;
- `DATABASE_URL` injected from the database, `SESSION_SECRET` generated by Render,
  `NODE_ENV=production`.

After the first deploy the schema and seed are loaded once with `node db/setup.mjs`
(it uses the `pg` driver, so no `psql` binary is needed on the host). Every later push
redeploys the service; the database keeps its data.

---

## 2. How AI was used

The build was done with an AI coding assistant (Claude, via Claude Code).

**What it was asked to do**
- Read the three source documents (the build brief, the original model, the assessment
  feedback) and the three SQL files, then propose a staged plan.
- Scaffold the repo, write the Express API route by route, and build the React client
  screen by screen, matching a Figma Make design for the styling.
- Break the work into a readable sequence of git commits.

**What was accepted**
- The overall shape: `client/` + `server/` split, session-based role switch, the API
  surface, the Tailwind design tokens taken from the Figma design.
- The transactional order-placement query, the parallel `max(kitchen, bar)` wait
  estimate, and the `ON CONFLICT (order_id)` rating upsert.
- The staged commit history.

**What was rejected or corrected**
- The first pass had the role toggle **wipe the customer's session** on every switch,
  so a customer who peeked at the waiter view lost their order. Changed so the toggle
  only flips the view and keeps identity + current order; a separate "start a new order"
  action is the explicit reset.
- The initial `db/setup.mjs` shelled out to `psql`, which is not present in a Render
  shell. Rewritten to run the `.sql` files through the `pg` driver (stripping the
  `psql`-only `\echo` / `\gexec` lines).
- The off-canvas cart drawer widened the page (horizontal scroll) until `overflow-x`
  was clipped on the body, and the item table had to be made to scroll inside its card
  on mobile.
- The three SQL files were kept **exactly as provided** — the assistant proposed adding
  an `image_url` column for food photos and that was declined; the cards use a
  category-tinted band instead.

---

## 3. What the application does, step by step

### Welcome screen
Opening the app shows a short welcome page for the active venue — its name and address,
a one-line explanation of how ordering works, and a **View the menu** button. It is shown
only to a fresh customer; someone with an order already in progress goes straight to
their tracking screen, and the waiter view skips it entirely.

### Menu browsing
**View the menu** opens the menu for the active venue — every available item, with a
`BROWSE` sidebar listing **All** and the five categories (Starters, Main Courses, Sides,
Desserts, Drinks) with a live count each. Each card shows the preparation time, the price
in naira, the name and a short description. No identity is needed to browse.

### Order placement
`+ Add to Order` puts an item in the cart (the header shows the count). Opening the cart
lists the lines with quantity steppers and a running total. **Continue** asks for a name
(optional) and a **table number** (required); **Place order** then:
1. creates the `customer` row and stores the identity in the session;
2. inserts the `orders` row (`status = 'pending'`) and one `order_item` per line, each
   with a snapshot of the current price;
3. sets the order's **estimated wait** to `max(sum of kitchen prep times, sum of bar
   prep times)` — the kitchen and bar work in parallel.

The customer lands on the **order tracking** screen: status, a live **MM:SS countdown**
to the estimated ready time (which flips to "running late" once the estimate is passed,
then to "served in N min" afterwards), the itemised list with the total, and "who's
handling this" (empty until a waiter picks it up). The screen polls every 5 seconds and
survives a page refresh.

A customer who has lost their session (closed the tab, or is on another device) can get
back to this screen from the welcome page — **"Already ordered? Check your order status"**
asks for the **name and table number** used on the order and reopens its tracking screen.

### Order assignment
Switching to **Waiter** shows the order board, newest and most urgent first. A pending
order has three dropdowns — **waiter, chef, bartender** — filled from the seeded staff
lists. **Confirm assignment** records the three on the order, moves it to `preparing`,
and stamps `prep_start_time` on every item. A preparing order shows the assigned team and
a **Mark served** button, which sets `status = 'served'`, `served_at`, the
`actual_wait_minutes`, and `prep_end_time` on every item.

### Complaint and rating
While an order is active the customer sees a **"Taking too long?"** box. Submitting it
stores a `complaint` (status `open`) against the order; it then shows on the order for
the customer and as a red **complaint** flag with the text on the waiter's board, where
**Mark complaint resolved** closes it and records `resolved_by_waiter_id`. Once the order
is served (or paid) the customer can leave a **1–5 star rating** with an optional comment;
re-rating replaces the previous one.

### Payment
On a served order the customer sees **"Pay now (simulated)"**. It inserts a `payment` row
(`is_pretend = TRUE`, amount taken from the item subtotals, `received_by_waiter_id` = the
order's waiter) and moves the order to `paid`. The screen then shows a paid card with a
clear **"PRETEND PAYMENT — NO REAL MONEY MOVED"** badge. The waiter's board can also take
the payment ("Take payment (simulated)") for a customer who has already left the table.

Everything above is stored in PostgreSQL — refreshing any screen reloads the same state.

---

## 4. How to use the deployed link

1. **Open the link.** You land on the venue's welcome screen — click **View the menu**.
2. **Browse.** Use the `BROWSE` sidebar to filter by category.
3. **Order.** Add a few items, open the cart (top-right), **Continue**, enter a table
   number like `T05`, **Place order**. You are now on the tracking screen with a wait
   estimate.
4. **Be the waiter.** Click **Waiter** in the header. Find your order (it is `pending`),
   pick a waiter, chef and bartender, **Confirm assignment**. The order is now
   `preparing`. Click **Mark served**.
5. **Back to the customer.** Click **Customer** — your order is still there, now
   `served`. (Optional: before serving, use "Taking too long?" to file a complaint, then
   resolve it from the waiter board.)
6. **Pay.** Click **Pay now (simulated)**. The order shows as paid with the pretend-payment
   badge.
7. **Rate.** Leave a star rating and a comment.
8. **Start over.** "Start a new order" clears the visit so the next person can begin fresh.

The **Customer / Waiter** switch in the header is the only thing you need to move between
the two roles — there is no login.
