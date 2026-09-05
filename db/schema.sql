-- ============================================================================
--  CHOWLY PLATFORM - DATABASE SCHEMA (PostgreSQL)
-- ----------------------------------------------------------------------------
--  Built from the Application Architecture model, with the three corrections
--  from the assessment feedback applied:
--    1. A RESTAURANT entity is added so the model is multi-tenant
--       (Chowly is adopted BY restaurants, not hard-wired to one site).
--    2. prep_start_time / prep_end_time are recorded on ORDER_ITEM so a
--       per-item delay can be proven from the data alone.
--    3. A staff foreign key is added to PAYMENT (received_by_waiter_id) and
--       to COMPLAINT (resolved_by_waiter_id) so the staff-side story is
--       fully traceable.
--
--  Two further changes were forced by the build (explained in the report):
--    4. table_number moved from CUSTOMER to ORDERS - a table belongs to a
--       single visit, not permanently to a person.
--    5. ORDER_ITEM stores unit_price_naira as a snapshot taken at order time,
--       so historical totals never move when a menu price is later edited.
--
--  Run order:  psql ... -f db/schema.sql   then   psql ... -f db/seed.sql
--  This script is idempotent: it drops and recreates every object.
-- ============================================================================

BEGIN;

-- Drop in reverse dependency order so foreign keys never block us.
DROP TABLE IF EXISTS rating        CASCADE;
DROP TABLE IF EXISTS complaint     CASCADE;
DROP TABLE IF EXISTS payment       CASCADE;
DROP TABLE IF EXISTS order_item    CASCADE;
DROP TABLE IF EXISTS orders        CASCADE;
DROP TABLE IF EXISTS bartender     CASCADE;
DROP TABLE IF EXISTS chef          CASCADE;
DROP TABLE IF EXISTS waiter        CASCADE;
DROP TABLE IF EXISTS menu_item     CASCADE;
DROP TABLE IF EXISTS customer      CASCADE;
DROP TABLE IF EXISTS restaurant    CASCADE;

DROP TYPE IF EXISTS order_status       CASCADE;
DROP TYPE IF EXISTS menu_category      CASCADE;
DROP TYPE IF EXISTS payment_status     CASCADE;
DROP TYPE IF EXISTS complaint_status   CASCADE;

-- ----------------------------------------------------------------------------
--  ENUM TYPES
--  An ENUM constrains a column to a fixed set of text values at the database
--  level - the DB itself rejects a typo like 'srved', not just the app.
-- ----------------------------------------------------------------------------
CREATE TYPE menu_category    AS ENUM ('starter', 'main', 'dessert', 'sides', 'drinks');
CREATE TYPE order_status      AS ENUM ('pending', 'preparing', 'served', 'paid', 'cancelled');
CREATE TYPE payment_status    AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE complaint_status  AS ENUM ('open', 'resolved');

-- ----------------------------------------------------------------------------
--  1. RESTAURANT  (NEW - correction #1)
--     Every operational row below hangs off a restaurant, so one Chowly
--     deployment can serve many independent venues.
-- ----------------------------------------------------------------------------
CREATE TABLE restaurant (
    id          SERIAL PRIMARY KEY,
    name        TEXT        NOT NULL,
    address     TEXT,
    phone       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
--  2. CUSTOMER
--     A person who dines and orders. table_number is NOT here any more - see
--     correction #4. A customer can visit any restaurant, so no restaurant_id.
-- ----------------------------------------------------------------------------
CREATE TABLE customer (
    id          SERIAL PRIMARY KEY,
    name        TEXT        NOT NULL,
    phone       TEXT,
    email       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
--  3. MENU_ITEM
--     Food and drink items. is_available lets a waiter hide a sold-out dish
--     without deleting its history.
-- ----------------------------------------------------------------------------
CREATE TABLE menu_item (
    id                SERIAL PRIMARY KEY,
    restaurant_id     INTEGER       NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    name              TEXT          NOT NULL,
    category          menu_category NOT NULL,
    description       TEXT,
    price_naira       NUMERIC(10,2) NOT NULL CHECK (price_naira >= 0),
    avg_prep_minutes  INTEGER       NOT NULL CHECK (avg_prep_minutes >= 0),
    is_available      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
--  4/5/6. STAFF - split into WAITER, CHEF, BARTENDER (accepted Variant 3).
--     Each is scoped to a restaurant.
-- ----------------------------------------------------------------------------
CREATE TABLE waiter (
    id              SERIAL PRIMARY KEY,
    restaurant_id   INTEGER     NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    phone           TEXT,
    shift_schedule  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chef (
    id              SERIAL PRIMARY KEY,
    restaurant_id   INTEGER     NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    specialty       TEXT,
    phone           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bartender (
    id              SERIAL PRIMARY KEY,
    restaurant_id   INTEGER     NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    specialty       TEXT,
    phone           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
--  7. ORDERS  ("order" is a reserved SQL word, so the table is "orders")
--     waiter/chef/bartender FKs live on the order header (accepted Variant 1).
--     They are NULL until a waiter assigns the order.
-- ----------------------------------------------------------------------------
CREATE TABLE orders (
    id                     SERIAL PRIMARY KEY,
    restaurant_id          INTEGER      NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    customer_id            INTEGER      NOT NULL REFERENCES customer(id),
    waiter_id              INTEGER      REFERENCES waiter(id),
    chef_id                INTEGER      REFERENCES chef(id),
    bartender_id           INTEGER      REFERENCES bartender(id),
    table_number           TEXT         NOT NULL,
    status                 order_status NOT NULL DEFAULT 'pending',
    order_datetime         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    estimated_wait_minutes INTEGER      NOT NULL DEFAULT 0,
    actual_wait_minutes    INTEGER,
    served_at              TIMESTAMPTZ,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
--  8. ORDER_ITEM  (the bridge table - resolves ORDERS <-> MENU_ITEM M:M)
--     Formerly OrderMenuItem. Adds prep_start_time / prep_end_time
--     (correction #2) and a unit_price_naira snapshot (change #5).
-- ----------------------------------------------------------------------------
CREATE TABLE order_item (
    id                SERIAL PRIMARY KEY,
    order_id          INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id      INTEGER       NOT NULL REFERENCES menu_item(id),
    quantity          INTEGER       NOT NULL CHECK (quantity > 0),
    unit_price_naira  NUMERIC(10,2) NOT NULL CHECK (unit_price_naira >= 0),
    subtotal_naira    NUMERIC(12,2) GENERATED ALWAYS AS (unit_price_naira * quantity) STORED,
    prep_start_time   TIMESTAMPTZ,
    prep_end_time     TIMESTAMPTZ,
    UNIQUE (order_id, menu_item_id)
);

-- ----------------------------------------------------------------------------
--  9. PAYMENT
--     One payment per order (order_id is UNIQUE). received_by_waiter_id is
--     correction #3. is_pretend is TRUE for the assignment's simulated pay.
-- ----------------------------------------------------------------------------
CREATE TABLE payment (
    id                     SERIAL PRIMARY KEY,
    order_id               INTEGER        NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    received_by_waiter_id  INTEGER        REFERENCES waiter(id),
    amount_naira           NUMERIC(12,2)  NOT NULL CHECK (amount_naira >= 0),
    method                 TEXT           NOT NULL DEFAULT 'cash',
    status                 payment_status NOT NULL DEFAULT 'completed',
    is_pretend             BOOLEAN        NOT NULL DEFAULT TRUE,
    paid_at                TIMESTAMPTZ    NOT NULL DEFAULT now(),
    created_at             TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
--  10. COMPLAINT
--     resolved_by_waiter_id is correction #3.
-- ----------------------------------------------------------------------------
CREATE TABLE complaint (
    id                     SERIAL PRIMARY KEY,
    order_id               INTEGER          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id            INTEGER          NOT NULL REFERENCES customer(id),
    resolved_by_waiter_id  INTEGER          REFERENCES waiter(id),
    description            TEXT             NOT NULL,
    resolution_status      complaint_status NOT NULL DEFAULT 'open',
    submitted_at           TIMESTAMPTZ      NOT NULL DEFAULT now(),
    resolved_at            TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
--  11. RATING
-- ----------------------------------------------------------------------------
CREATE TABLE rating (
    id            SERIAL PRIMARY KEY,
    order_id      INTEGER     NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id   INTEGER     NOT NULL REFERENCES customer(id),
    rating_value  INTEGER     NOT NULL CHECK (rating_value BETWEEN 1 AND 5),
    comment       TEXT,
    submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (order_id)
);

-- ----------------------------------------------------------------------------
--  INDEXES on the foreign keys we filter/join on most. PostgreSQL indexes a
--  PRIMARY KEY and a UNIQUE constraint automatically, but NOT a plain FK.
-- ----------------------------------------------------------------------------
CREATE INDEX idx_menu_item_restaurant ON menu_item(restaurant_id);
CREATE INDEX idx_orders_restaurant    ON orders(restaurant_id);
CREATE INDEX idx_orders_status        ON orders(status);
CREATE INDEX idx_orders_customer      ON orders(customer_id);
CREATE INDEX idx_order_item_order     ON order_item(order_id);
CREATE INDEX idx_complaint_order      ON complaint(order_id);
CREATE INDEX idx_rating_order         ON rating(order_id);

COMMIT;

-- Quick confirmation when run interactively.
\echo 'Schema created: 11 tables, 4 enum types, 7 indexes.'
