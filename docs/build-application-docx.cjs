/*
 * Chowly application document -> .docx, styled like the "cloud lab assignment" report
 * (A4 landscape, page border, blue title page + headings, TOC, numbered sections,
 * bordered "paste screenshot here" boxes with captions).
 *
 * Usage:  npm i -D docx  &&  node docs/build-application-docx.cjs "Chowly - Application Document.docx"
 *
 * The prose is a copy of docs/chowly-application.md adapted to the report layout;
 * edit the .docx directly in Word for the final version.
 */
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  TableOfContents, PageBreak, BorderStyle, LevelFormat, PageOrientation,
  PageBorderOffsetFrom, PageBorderDisplay, Table, TableRow, TableCell,
  WidthType, HeightRule, ShadingType, VerticalAlign,
} = require('docx');

const BLUE = '4472C4';        // accent1 - title page
const HEAD = '2F5496';        // accent1 / themeShade BF - headings
const CAPT = '44546A';        // text2 - captions
const FONT = 'Biome';
const CONTENT_W = 13950;      // landscape content width (16838 - 2*1440)

// ---------- helpers ----------------------------------------------------------
const blank = () => new Paragraph({ spacing: { after: 0 } });

const title = (t, size) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 0, line: 240 },
  children: [new TextRun({ text: t, bold: size >= 40, color: BLUE, size, font: FONT })],
});

const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });

const p = (t) => new Paragraph({
  spacing: { after: 160, line: 278 },
  children: t instanceof Array ? t : [new TextRun({ text: t })],
});

const lead = (label, rest) => new Paragraph({
  spacing: { after: 160, line: 278 },
  children: [new TextRun({ text: label, bold: true }), new TextRun({ text: rest || '' })],
});

const bullet = (t) => new Paragraph({
  bullet: { level: 0 },
  spacing: { after: 60, line: 278 },
  children: t instanceof Array ? t : [new TextRun({ text: t })],
});

const numbered = (ref) => (t) => new Paragraph({
  numbering: { reference: ref, level: 0 },
  spacing: { after: 60, line: 278 },
  children: t instanceof Array ? t : [new TextRun({ text: t })],
});

const caption = (t) => new Paragraph({
  style: 'Caption',
  spacing: { before: 60, after: 260 },
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: t, italics: true, color: CAPT, size: 18 })],
});

// A bordered placeholder box for a screenshot, with an italic caption under it.
const shot = (cap, heightTwip = 4600) => ([
  new Table({
    columnWidths: [CONTENT_W],
    width: { size: CONTENT_W, type: WidthType.DXA },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 6, color: 'B7B7B7' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: 'B7B7B7' },
      left:   { style: BorderStyle.SINGLE, size: 6, color: 'B7B7B7' },
      right:  { style: BorderStyle.SINGLE, size: 6, color: 'B7B7B7' },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [new TableRow({
      height: { value: heightTwip, rule: HeightRule.ATLEAST },
      children: [new TableCell({
        width: { size: CONTENT_W, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F4F6FA' },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [new TextRun({ text: 'paste screenshot here', italics: true, color: 'A6A6A6', size: 20 })],
        })],
      })],
    })],
  }),
  caption(cap),
]);

const tcell = (text, w, opts = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  shading: opts.head ? { type: ShadingType.CLEAR, color: 'auto', fill: 'D9E2F3' } : undefined,
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
  children: [new Paragraph({
    spacing: { after: 0, line: 260 },
    children: [new TextRun({ text, bold: !!opts.head, size: 20 })],
  })],
});

const table = (widths, rows) => new Table({
  columnWidths: widths,
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  borders: {
    top:    { style: BorderStyle.SINGLE, size: 4, color: 'AAB4C8' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'AAB4C8' },
    left:   { style: BorderStyle.SINGLE, size: 4, color: 'AAB4C8' },
    right:  { style: BorderStyle.SINGLE, size: 4, color: 'AAB4C8' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'D6DCE8' },
    insideVertical:   { style: BorderStyle.SINGLE, size: 4, color: 'D6DCE8' },
  },
  rows: rows.map((cells, i) => new TableRow({
    tableHeader: i === 0,
    children: cells.map((c) => tcell(c, widths[cells.indexOf(c)], { head: i === 0 })),
  })),
});

// ---------- content ---------------------------------------------------------
const nStep = numbered('orderSteps');
const nDeploy = numbered('deploySteps');
const nWalk = numbered('walkthrough');

const body = [];

// Title page
for (let i = 0; i < 5; i++) body.push(blank());
body.push(title('CHOWLY', 96));
body.push(title('PLATFORM', 96));
body.push(blank());
body.push(title('Building an In-Restaurant Ordering, Assignment & Payment Web App', 40));
for (let i = 0; i < 4; i++) body.push(blank());
body.push(title('Submitted', 28));
body.push(title('By', 28));
body.push(blank());
body.push(title('Chukwuma Nnaemeka', 56));
body.push(new Paragraph({ children: [new PageBreak()] }));

// TOC
body.push(h1('TABLE OF CONTENT'));
body.push(new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }));
body.push(new Paragraph({ children: [new PageBreak()] }));

// 1.0 Introduction
body.push(h1('1.0 Introduction'));
body.push(lead('Name: ', 'Chukwuma Nnaemeka'));
body.push(lead('Assignment: ', 'Chowly (Build) — TeSA Software Engineering'));
body.push(lead('Date submitted: ', '____________________'));
body.push(lead('Git repository: ', '____________________  (paste your GitHub URL)'));
body.push(lead('Deployed application — Vercel (use this): ', '____________________'));
body.push(lead('Deployed application — Render (first deploy, ~50 s cold start): ', '____________________'));
body.push(p(
  'This document reports on the build of Chowly, an in-restaurant platform. A visiting ' +
  'customer opens the app at their table, browses the food and drinks menu and places an ' +
  'order; the order is assigned to a waiter who records the chef and the bartender who ' +
  'prepared it and marks it served; if the order is seriously delayed the customer submits ' +
  'a complaint and a low rating against it; and payment for the order is taken on the ' +
  'platform — by the waiter — just before the customer leaves. The application is ' +
  'built on top of the data model produced in the first assignment, with the assessment ' +
  'feedback applied, and is deployed so that anybody with the link can use it.'));

// 2.0 How it was built
body.push(h1('2.0 How It Was Built'));

body.push(h3('2.1 The Stack'));
body.push(p('The brief does not mark the choice of stack, so the stack was kept small and explicit:'));
body.push(bullet([new TextRun({ text: 'Database — ', bold: true }), new TextRun('PostgreSQL. Relational data with hard foreign keys and enum-constrained status columns.')]));
body.push(bullet([new TextRun({ text: 'API — ', bold: true }), new TextRun('Node + Express with the pg driver. No ORM; the queries are short and readable.')]));
body.push(bullet([new TextRun({ text: 'Sessions — ', bold: true }), new TextRun('express-session with a connect-pg-simple store, so the current role survives a server restart on the host.')]));
body.push(bullet([new TextRun({ text: 'Client — ', bold: true }), new TextRun('React + Vite + Tailwind CSS. A single-page app carrying a small "fine dining" design system (cream ground, terracotta accent, a serif display face) taken from a Figma Make design.')]));
body.push(bullet([new TextRun({ text: 'Hosting — ', bold: true }), new TextRun('first deployed on Render (one Node web service + Render Postgres); Vercel added afterwards (SPA on the CDN + the API as a serverless function, Neon Postgres) because Render’s free tier is slow to wake from idle. See 2.5.')]));
body.push(p('There is no login. The brief only asks for "a way to act as the customer and as the waiter", so the app has a Customer / Waiter toggle in the header and nothing more.'));

body.push(h3('2.2 Project Structure'));
body.push(p('In development, one command runs the API on port 3000 and the Vite dev server on port 5173, with Vite proxying /api to Express. On Render the build compiles the client to client/dist and Express serves it with a single-page-app fallback; on Vercel the CDN serves client/dist and /api/* is routed to a serverless function. Either way the whole application is one origin (no CORS).'));
body.push(bullet([new TextRun({ text: 'db/ ', bold: true }), new TextRun('— schema.sql (11 tables, 4 enum types), seed.sql (2 venues, a 30-item Nigerian menu, staff, 4 sample orders), 00_create_role_and_db.sql, menu_images.sql, and setup.mjs (a pg-driver loader).')]));
body.push(bullet([new TextRun({ text: 'server/ ', bold: true }), new TextRun('— the Express JSON API: app.js (the app), index.js (app.listen for Render/local), db.js (one connection pool), bootstrap.js (first-boot schema load), config.js, middleware.js (role guards), and routes for session, menu, and orders.')]));
body.push(bullet([new TextRun({ text: 'client/ ', bold: true }), new TextRun('— the Vite + React SPA: a SessionContext and CartContext, pages (LandingPage, MenuPage, OrderLookup, OrderTrackingPage, WaiterDashboard) and components. Dish photos live in client/public/menu/.')]));
body.push(bullet([new TextRun({ text: 'render.yaml, vercel.json, api/serverless.js, docs/ ', bold: true }), new TextRun('— the two deployment configs, the Vercel function entry, and this document.')]));

body.push(h3('2.3 The Data Model as Finally Implemented'));
body.push(p('The first assignment’s model was graded 92/100. The assessor asked for three additions, and building the application forced three more. All six are in db/schema.sql:'));
body.push(table([700, 4600, 8650], [
  ['#', 'Change', 'Reason'],
  ['1', 'New RESTAURANT table; every operational row has a restaurant_id.', 'Feedback: the story frames Chowly as an app adopted by restaurants, so the model must be multi-tenant.'],
  ['2', 'prep_start_time / prep_end_time on ORDER_ITEM.', 'Feedback: a per-item delay should be provable from the data alone. "Assign" stamps the start; "mark served" stamps the end.'],
  ['3', 'received_by_waiter_id on PAYMENT, resolved_by_waiter_id on COMPLAINT.', 'Feedback: the staff side of payment and complaint resolution should be traceable.'],
  ['4', 'table_number moved from CUSTOMER to ORDERS.', 'A table belongs to a single visit, not permanently to a person.'],
  ['5', 'unit_price_naira snapshot on ORDER_ITEM (subtotal_naira is a generated column).', 'Historical order totals must not move when a menu price is later edited.'],
  ['6', 'Nullable image_url on MENU_ITEM.', 'The menu card shows a dish photo when set, and a category-tinted band when not. Photos are set in db/menu_images.sql.'],
]));
body.push(p('The eleven tables are restaurant, customer, menu_item, waiter, chef, bartender, orders, order_item (the Order-to-MenuItem bridge), payment, complaint and rating. Four enum types constrain the status columns. A twelfth table, session, is created at runtime by connect-pg-simple and is not part of the model.'));
body.push(p('The seed data preserves the reconciliation the first assignment was praised for: order 1’s items total ₦16,000 and its payment is ₦16,000; order 4’s total and payment are both ₦5,000; order 2 is past its 20-minute estimate with an open complaint and a 1-star rating.'));
body.push(...shot('The Chowly database — 11 tables listed by \\dt in psql'));

body.push(h3('2.4 The API'));
body.push(p('Every endpoint returns JSON and sits under /api. The current role lives in a signed session cookie; there is no login.'));
body.push(table([4300, 1500, 8150], [
  ['Method and path', 'Role', 'Purpose'],
  ['GET /api/health', 'any', 'Liveness check (no database) — the Render health check.'],
  ['GET /api/health/db', 'any', 'Database round-trip check (SELECT now()).'],
  ['GET /api/me', 'any', 'Active role, customer identity, current order, venue.'],
  ['POST /api/session/customer', 'any', 'Create the customer row and become a customer.'],
  ['POST /api/session/role', 'any', 'Flip the Customer / Waiter view (keeps identity).'],
  ['POST /api/session/switch', 'any', 'Full reset — forget identity and current order.'],
  ['GET /api/menu', 'any', 'Available items for the venue, including image_url.'],
  ['GET /api/staff', 'waiter', 'Waiter / chef / bartender lists for the dropdowns.'],
  ['POST /api/orders', 'customer', 'Place an order (one transaction; price snapshot; wait estimate).'],
  ['POST /api/orders/lookup', 'any', 'Find an order by name + table and resume the session on it.'],
  ['GET /api/orders/:id', 'any', 'Full order detail: items, staff, payment, complaint, rating.'],
  ['GET /api/waiter/orders', 'waiter', 'The board: every order with items, total, payment method, open complaint.'],
  ['POST /api/orders/:id/assign', 'waiter', 'Record waiter / chef / bartender, move to preparing, stamp prep start.'],
  ['POST /api/orders/:id/serve', 'waiter', 'Move to served; stamp served_at, actual_wait_minutes, prep end.'],
  ['POST /api/orders/:id/complaint', 'customer', 'File a complaint against the order.'],
  ['POST /api/orders/:id/rating', 'customer', '1–5 rating with an optional comment (upsert on order_id).'],
  ['POST /api/orders/:id/pay', 'waiter', 'Record a pretend payment (cash / card / transfer); move to paid.'],
  ['POST /api/complaints/:id/resolve', 'waiter', 'Close a complaint and record resolved_by_waiter_id.'],
]));

body.push(h3('2.5 Deployment'));
body.push(p('The application was first deployed on Render: one free Node web service serving the SPA and the API together, plus a free Render Postgres instance, wired up by render.yaml. That works, but Render’s free web service sleeps after about 15 minutes idle and takes roughly 50 seconds to wake on the next request, so a facilitator opening a cold link would sit on a blank page for the best part of a minute.'));
body.push(p('To fix that, a second deployment was added on Vercel, from the same repository. On Vercel the static SPA is served straight from the CDN (instant) and the API runs as one serverless function that cold-starts in a fraction of a second against Neon (serverless Postgres). Vercel is therefore the link to use; Render is kept as a fallback and to show the same code runs unchanged as a long-lived server.'));
body.push(p('Adding Vercel meant factoring the Express app into server/src/app.js (the app) plus two thin entry points: server/src/index.js still calls app.listen() for Render and local use, and api/serverless.js exports the same app as a Vercel function. server/src/bootstrap.js loads schema.sql, seed.sql and menu_images.sql the first time the app runs against an empty database (checked via the menu_item table; a no-op once it exists), so neither platform needs a shell for the initial data load. db.js turns on SSL when NODE_ENV is production, and the session cookie is secure behind both platforms’ HTTPS.'));
body.push(lead('Render ', '(render.yaml): a free Postgres instance and a free Node web service in the same region. The build command runs "npm install --include=dev" for the client because Render sets NODE_ENV=production during the build, which would otherwise skip Vite and Tailwind and fail with "vite: not found". The health check is a plain liveness check that does not touch the database, so a slow first-boot database cannot fail the deploy.'));
body.push(lead('Vercel ', '(vercel.json): client/ is built and served as static output; /api/* is rewritten to the api/serverless.js function; everything else falls back to index.html. The Neon database is created from the Vercel dashboard (Storage tab, no separate Neon account) and its connection string is injected automatically; db.js accepts DATABASE_URL, POSTGRES_URL or POSTGRES_PRISMA_URL. SESSION_SECRET is added by hand; NODE_ENV=production is automatic.'));
body.push(p('To deploy to Vercel: import the GitHub repo at vercel.com/new; in the project, Storage → Create Database → Neon; add SESSION_SECRET under Settings → Environment Variables; redeploy. The first request loads the schema and seed, then it is instant. To reset either database by hand, run node db/setup.mjs from a laptop against that database’s connection string.'));
body.push(...shot('The Render Blueprint creating chowly-db and the chowly web service (first deployment)'));
body.push(...shot('The application open at its Render URL — note the ~50 s cold start'));
body.push(...shot('The Vercel project — Storage (Neon) and the SESSION_SECRET variable'));
body.push(...shot('The application open at its Vercel URL (loads instantly)'));

// 3.0 How AI was used
body.push(h1('3.0 How AI Was Used'));
body.push(p('The build was done with an AI coding assistant (Claude, via Claude Code).'));
body.push(lead('What it was asked to do'));
body.push(bullet('Read the three source documents (the build brief, the original model, the assessment feedback) and the three SQL files, then propose a staged plan.'));
body.push(bullet('Scaffold the repository, write the Express API route by route, and build the React client screen by screen, styled after the Figma Make design.'));
body.push(bullet('Deliver the work as a readable sequence of git commits, then apply a long run of small follow-up changes, each as its own commit.'));
body.push(lead('What was accepted'));
body.push(bullet('The overall shape: the client / server split, the session role switch, the API surface, and the Tailwind design tokens taken from the Figma design.'));
body.push(bullet('The transactional order-placement query, the parallel max(kitchen, bar) wait estimate, and the "on conflict" rating upsert.'));
body.push(bullet('A decision to reset the messy early git history to a clean, staged commit sequence (the pre-reset history is kept on an archive branch).'));
body.push(bullet('Later feature requests taken as-is: a welcome landing page; order lookup by name and table; a live MM:SS countdown; the logo linking home; the table picker as a 1–20 dropdown; the waiter opening a paid card for a full summary; optional dish photos; a second deployment on Vercel.'));
body.push(lead('What was rejected or corrected'));
body.push(bullet('The first pass had the role toggle wipe the customer’s session on every switch, so a customer who peeked at the waiter view lost their order. Changed so the toggle only flips the view and keeps the identity and current order.'));
body.push(bullet('db/setup.mjs first shelled out to psql, which a Render shell does not have. Rewritten to run the .sql files through the pg driver.'));
body.push(bullet('The cart drawer widened the page until overflow was clipped; the order item table had to be made to scroll inside its card on mobile.'));
body.push(bullet('Payment was first allowed from either role. Corrected to waiter-only, with the waiter choosing the method the guest used.'));
body.push(bullet('image_url was initially left out to keep the SQL files untouched; when photos were wanted it was added to schema.sql, with the URLs kept in a separate menu_images.sql.'));
body.push(bullet('Small fixes on request: reloading the menu no longer bounces to the welcome page; the "back to your order" button was removed from the welcome page.'));
body.push(bullet('The first Render deploy failed because the build skipped the client’s dev dependencies, and the mobile layout zoomed out because a grid track grew past the viewport width. Both were found by testing the deployed build, not by review.'));
body.push(...shot('A section of the AI session — a feature request and the change it produced'));
body.push(...shot('The staged git commit history (git log --oneline)'));

// 4.0 What the application does
body.push(h1('4.0 What the Application Does, Step by Step'));

body.push(h3('4.1 Welcome Screen'));
body.push(p('Opening the app shows a short welcome page for the active venue — its name and address, a one-line explanation of how ordering works, and a "View the menu" button. It is shown only to a fresh customer; someone with an order already in progress goes straight to their tracking screen, and the waiter view skips it. Once the customer taps "View the menu" the browser tab remembers it, so reloading mid-browse stays on the menu.'));
body.push(...shot('The welcome screen for the active venue'));

body.push(h3('4.2 Menu Browsing'));
body.push(p('"View the menu" opens the menu for the active venue — every available item, with a BROWSE sidebar listing All and the five categories (Starters, Main Courses, Sides, Desserts, Drinks) with a live count each. Each card shows the preparation time, the price in naira, the name, a short description, and a dish photo where one is set. No identity is needed to browse.'));
body.push(...shot('The menu — category sidebar, dish photos, prep time and price on each card'));

body.push(h3('4.3 Placing an Order'));
body.push(p('"+ Add to Order" puts an item in the cart, and the header shows the count. Opening the cart lists the lines with quantity steppers and a running total. "Continue" asks for a name (optional) and the table (a dropdown of tables 1–20, required). "Place order" then:'));
body.push(nStep('creates the customer row and stores the identity in the session;'));
body.push(nStep('inserts the order (status pending) and one order_item per line, each with a snapshot of the current price;'));
body.push(nStep('sets the estimated wait to the larger of the kitchen queue and the bar queue, since the two prepare in parallel.'));
body.push(...shot('The cart, with the table dropdown, at checkout'));

body.push(h3('4.4 Order Tracking and the Wait Countdown'));
body.push(p('The customer lands on the order tracking screen: the status, a live MM:SS countdown to the estimated ready time (which flips to "running late" once the estimate is passed, then to "served in N minutes" afterwards), the itemised list with the total, and "who’s handling this" (empty until a waiter picks it up). The screen polls every five seconds and survives a page refresh.'));
body.push(p('A customer who has lost their session — closed the tab, or is on another device — can get back to this screen from the welcome page. "Already ordered? Check your order status" asks for the name and table used on the order and reopens its tracking screen.'));
body.push(...shot('The order tracking screen with the live MM:SS countdown'));
body.push(...shot('Checking an existing order by name and table'));

body.push(h3('4.5 Order Assignment (Waiter)'));
body.push(p('Switching to Waiter shows the order board, sorted pending → preparing → served → paid. Every card lists the ordered items with their subtotals and the order total. A pending order has three dropdowns — waiter, chef, bartender — filled from the seeded staff lists. "Confirm assignment" records the three on the order, moves it to preparing, and stamps prep_start_time on every item. A preparing order shows the assigned team and a "Mark served" button, which sets the status to served and stamps served_at, actual_wait_minutes and prep_end_time.'));
body.push(p('A paid card is collapsible: opening it fetches the full order and shows a summary — placed / served / paid times, the prep team, the itemised bill, the payment (amount, method and time) with the pretend badge, and any complaint (with its resolution) and rating.'));
body.push(...shot('The waiter order board, with each card’s items and total'));
body.push(...shot('Assigning a waiter, chef and bartender to a pending order'));
body.push(...shot('A paid order opened for its full summary, including the payment method used'));

body.push(h3('4.6 Complaint and Rating'));
body.push(p('While an order is active the customer sees a "Taking too long?" box. Submitting it stores a complaint (status open) against the order; it then shows on the order for the customer and as a red "complaint" flag with the text on the waiter’s board, where "Mark complaint resolved" closes it and records resolved_by_waiter_id. Once the order is served the customer can leave a 1–5 star rating with an optional comment; re-rating replaces the previous one.'));
body.push(...shot('The customer filing a complaint on a delayed order'));
body.push(...shot('A 1–5 star rating on a served order'));

body.push(h3('4.7 Payment'));
body.push(p('Payment is taken by the waiter on the served order — the customer’s screen only shows the total and a note that the waiter will collect it. On the board the waiter picks the method the guest used (cash, card or transfer) and confirms; that inserts a payment row (marked pretend, amount from the item subtotals, received_by_waiter_id set to the order’s waiter, method set to the chosen one) and moves the order to paid. Both screens then show the paid amount with a clear "PRETEND PAYMENT — NO REAL MONEY MOVED" badge.'));
body.push(...shot('The waiter taking payment — choosing Cash / Card / Transfer'));
body.push(...shot('The paid order with the PRETEND PAYMENT badge on the customer screen'));
body.push(p('Every step above is stored in PostgreSQL — refreshing any screen reloads the same state.'));

// 5.0 How to use the deployed link
body.push(h1('5.0 How to Use the Deployed Link'));
body.push(p('Use the Vercel link — it loads instantly. The Render link works identically but, on the free tier, takes about 50 seconds to wake if it has been idle.'));
body.push(p('A walkthrough a stranger can follow. The Customer / Waiter switch in the header is the only thing needed to move between the two roles — there is no login. Clicking the Chowly logo always returns to the welcome page.'));
body.push(nWalk('Open the link. You land on the venue’s welcome screen — click "View the menu".'));
body.push(nWalk('Browse. Use the BROWSE sidebar to filter by category.'));
body.push(nWalk('Order. Add a few items, open the cart (top right), "Continue", pick your table from the dropdown, "Place order". You are now on the tracking screen with a wait estimate.'));
body.push(nWalk('Be the waiter. Click "Waiter" in the header. Each order card lists its items. Find your order (it is pending), pick a waiter, chef and bartender, "Confirm assignment". The order is now preparing. Click "Mark served".'));
body.push(nWalk('Take payment (as the waiter). On the served order pick how the guest paid — Cash, Card or Transfer — and click "Take payment". The order is now paid.'));
body.push(nWalk('Back to the customer. Click "Customer"; the order shows as paid with the pretend-payment badge. (Optional: before serving, use "Taking too long?" to file a complaint, then resolve it from the waiter board.)'));
body.push(nWalk('Rate. Leave a star rating and a comment.'));
body.push(nWalk('Start over. "Start a new order" clears the visit so the next person can begin fresh.'));

// 6.0 Reflection
body.push(h1('6.0 Reflection'));
body.push(p('The most useful lesson of the build was that a model only proves itself once something runs on top of it. The three corrections the assessor asked for — a RESTAURANT entity, per-item preparation timestamps, and staff foreign keys on payment and complaint — each turned into a concrete feature: multi-tenant queries, a provable delay on the tracking screen, and a traceable "who took the payment / who resolved the complaint". Two more changes only became obvious while wiring screens together: a table belongs to a visit rather than to a person, and an order line must snapshot its price so historical totals never move.'));
body.push(p('Working with an AI assistant was fastest when the request was specific and slowest when it was vague; most of the corrections above came from testing the running app, not from reading code. Keeping the work in small, single-purpose commits made those corrections cheap to make and easy to explain, and made it straightforward to reset an early messy history into a clean one without losing the record of how the app was actually built.'));

// ---------- document -------------------------------------------------------
const doc = new Document({
  features: { updateFields: true },
  styles: {
    default: {
      document: { run: { font: FONT, size: 24 }, paragraph: { spacing: { after: 160, line: 278 } } },
    },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 36, color: HEAD },
        paragraph: { spacing: { before: 360, after: 100 }, outlineLevel: 0, keepNext: true } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 32, color: HEAD },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1, keepNext: true } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 28, color: HEAD },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2, keepNext: true } },
      { id: 'Caption', name: 'Caption', basedOn: 'Normal', next: 'Normal',
        run: { italics: true, size: 18, color: CAPT },
        paragraph: { spacing: { after: 240, line: 240 } } },
    ],
  },
  numbering: {
    config: [
      { reference: 'orderSteps', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'deploySteps', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'walkthrough', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { orientation: PageOrientation.LANDSCAPE, width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        borders: {
          pageBorders: { offsetFrom: PageBorderOffsetFrom.PAGE, display: PageBorderDisplay.ALL_PAGES },
          pageBorderTop:    { style: BorderStyle.SINGLE, size: 12, space: 24, color: '000000' },
          pageBorderRight:  { style: BorderStyle.SINGLE, size: 12, space: 24, color: '000000' },
          pageBorderBottom: { style: BorderStyle.SINGLE, size: 12, space: 24, color: '000000' },
          pageBorderLeft:   { style: BorderStyle.SINGLE, size: 12, space: 24, color: '000000' },
        },
      },
    },
    children: body,
  }],
});

const out = process.argv[2] || 'Chowly - Application Document.docx';
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log('wrote', out, buf.length, 'bytes'); });
