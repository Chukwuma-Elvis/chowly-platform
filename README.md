# Chowly

In-restaurant ordering, order assignment, complaint & rating, and (pretend) payment.
A visiting customer browses the menu, places an order and watches the wait; a waiter
picks the order up, records the chef and bartender, and marks it served; if it drags,
the customer complains and rates; payment is taken on the platform before they leave.

Built for the TeSA **CHOWLY (BUILD)** assignment, on top of the graded data model
(with the assessor's corrections applied - see `docs/chowly-application.md`).

## Stack

| Layer    | Choice                                             |
|----------|----------------------------------------------------|
| Database | PostgreSQL (`db/schema.sql`, `db/seed.sql`)         |
| API      | Node + Express (`server/`), `pg`, session role switch |
| Client   | React + Vite + Tailwind CSS (`client/`)             |
| Hosting  | **Vercel** (SPA on the CDN + `/api` function, Neon Postgres) — primary; **Render** (web service + Render Postgres) — fallback |

## Repository layout

```
db/       schema.sql, seed.sql, 00_create_role_and_db.sql, setup.mjs
server/   Express JSON API  (also serves the built client in production)
client/   Vite + React single-page app
docs/     the application write-up
```

## Run it locally

Prerequisites: Node >= 20, PostgreSQL (with `psql` on your PATH).

```bash
# 1. one-time: create the role + database
psql -U postgres -f db/00_create_role_and_db.sql

# 2. configure
cp .env.example server/.env          # then edit if your Postgres differs

# 3. install
npm install
npm --prefix server install
npm --prefix client install

# 4. load schema + seed data (also applies db/menu_images.sql)
npm run db:setup

# 5. start API (:3000) and Vite dev server (:5173) together
npm run dev
```

Open http://localhost:5173. Use the **Customer / Waiter** switch in the header to move
between the two roles - no login required.

### Menu photos

`menu_item.image_url` is optional; a card without one shows a category-tinted band.
To add photos, edit `db/menu_images.sql` (either `/menu/<file>.jpg` paths for files you
drop in `client/public/menu/`, or full image URLs) and run `npm run db:images`.

## Production build

```bash
npm run build                 # builds client/dist, installs server deps
NODE_ENV=production npm start  # Express serves the API + the SPA on :3000
```

## Push to GitHub

```bash
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

(Create the empty repo on GitHub first — no README/licence, so the histories don't
diverge.) The build has no secrets in it; `server/.env` is git-ignored.

## Deploy

The app is deployed on both platforms from this one repo. **Vercel is the primary link**
— Render's free web service sleeps after ~15 min idle and takes ~50 s to wake, so a cold
link looks broken; Vercel serves the SPA from the CDN and the API as a fast serverless
function. Render is kept as a fallback.

Both self-load the database: `server/src/bootstrap.js` runs `schema.sql`, `seed.sql` and
`menu_images.sql` the first time the app hits an empty database, and is a no-op after
that, so redeploys keep the data.

### Vercel (primary) — `vercel.json`

1. **A database.** Create a free project at [neon.tech](https://neon.tech). Copy the
   **pooled** connection string (`...-pooler...`, `?sslmode=require`).
2. **Import.** [vercel.com/new](https://vercel.com/new) → import the GitHub repo. Vercel
   reads `vercel.json` (build → `client/dist`, `/api/*` → the function). Add env vars:
   `DATABASE_URL` = the Neon string, `SESSION_SECRET` = any long random string. Deploy.
3. **Open the URL.** The first request loads the schema + seed (a few seconds), then it's
   instant. Every `git push` redeploys.

### Render (fallback) — `render.yaml`

1. Render dashboard → **New +** → **Blueprint** → connect the repo. Render reads
   `render.yaml` and creates `chowly-db` and the `chowly` web service; `DATABASE_URL`,
   `SESSION_SECRET` and `NODE_ENV` are set for you. **Apply**.
2. Open the service URL. It self-loads the database on first boot.

### Resetting or reloading a hosted database

Run `setup.mjs` from your machine against that database's connection string
(Neon dashboard, or Render → `chowly-db` → *Connect* → external string):

```bash
DATABASE_URL="postgres://…" node db/setup.mjs           # full reset (schema + seed + images)
DATABASE_URL="postgres://…" node db/setup.mjs --images  # just re-apply menu photos
```
