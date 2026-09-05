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

# 4. load schema + seed data
npm run db:setup

# 5. start API (:3000) and Vite dev server (:5173) together
npm run dev
```

Open http://localhost:5173. Use the **Customer / Waiter** switch in the header to move
between the two roles - no login required.

## Production build

```bash
npm run build                 # builds client/dist, installs server deps
NODE_ENV=production npm start  # Express serves the API + the SPA on :3000
```

## Deploy to Render

The repo ships a `render.yaml` blueprint: one free Postgres instance plus one Node
web service that builds `client/` and serves it alongside the API.

1. Push this repo to GitHub.
2. Render dashboard → **New +** → **Blueprint** → pick the repo. Render reads
   `render.yaml` and creates `chowly-db` and the `chowly` web service.
   `DATABASE_URL` is wired from the database and `SESSION_SECRET` is generated.
3. When the first deploy is green, load the schema and seed **once**. Either:
   - open the web service **Shell** in Render and run
     ```bash
     node db/setup.mjs
     ```
     (the service already has `DATABASE_URL` in its environment), **or**
   - copy the database's *External Connection String* from Render and run it
     locally:
     ```bash
     DATABASE_URL="postgres://…external…" node db/setup.mjs
     ```
4. Open the service URL. Use the **Customer / Waiter** switch to move between roles.

Redeploys happen automatically on every push to the default branch; the database
keeps its data across them.
