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
| Hosting  | Render (web service + Render Postgres)              |

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

## Deploy to Render

The repo ships a `render.yaml` blueprint: one free Postgres instance plus one Node
web service that builds `client/` and serves it alongside the API.

1. **Blueprint.** Render dashboard → **New +** → **Blueprint** → connect the GitHub
   repo. Render reads `render.yaml` and creates the `chowly-db` database and the
   `chowly` web service. `DATABASE_URL` is wired from the database, `SESSION_SECRET`
   is generated, `NODE_ENV=production`. Click **Apply** and wait for the first deploy.
2. **Load the database — once.** When the deploy is green, open the `chowly` service
   → **Shell** tab and run:
   ```bash
   node db/setup.mjs
   ```
   That applies `schema.sql`, `seed.sql` and `menu_images.sql` (it uses the `pg`
   driver, so no `psql` is needed). Re-run any time to reset the data.
   *(Alternative: copy the database's External Connection String from Render and run
   `DATABASE_URL="postgres://…" node db/setup.mjs` from your machine.)*
3. **Open the service URL.** Use the **Customer / Waiter** switch to move between roles.

Every later `git push` to `main` redeploys automatically; the database keeps its data.
On the free tier the web service sleeps after ~15 min idle — the first request after
that takes ~30–60 s to wake.

### Updating menu photos after deploy

`client/public/menu/*` files ship in the build automatically. After changing
`db/menu_images.sql`, re-run `node db/setup.mjs --images` in the Render Shell.
