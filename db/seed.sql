-- ============================================================================
--  CHOWLY PLATFORM - SEED DATA
-- ----------------------------------------------------------------------------
--  Loads the sample records from the Application Architecture model so the
--  running app has a menu, staff and a few live orders on first boot.
--
--  The reconciliation the feedback praised is preserved:
--    * Order 1 (OD001) items total 16000  == Payment 1 amount 16000
--    * Order 4 (OD004) items total  5000  == Payment 2 amount  5000
--    * Order 2 (OD002) is past its 20-min estimate with no prep_end_time,
--      and carries an open complaint + a 1-star rating.
--
--  Assumes a freshly created schema, so SERIAL ids run 1,2,3... in insert
--  order. Run:  psql ... -f db/seed.sql
-- ============================================================================

BEGIN;

-- Wipe any existing rows and reset id counters so re-seeding is repeatable.
TRUNCATE rating, complaint, payment, order_item, orders,
         bartender, chef, waiter, menu_item, customer, restaurant
         RESTART IDENTITY CASCADE;

-- ----------------------------------------------------------------------------
--  RESTAURANTS  (correction #1 - the model is now multi-tenant)
-- ----------------------------------------------------------------------------
INSERT INTO restaurant (name, address, phone) VALUES
    ('mekx restuarant',  '14 Adeola Odeku Street, Victoria Island, Lagos', '0700-CHOWLY-1'),  -- id 1
    ('Chowly Lounge',   '3 Yakubu Gowon Crescent, Asokoro, Abuja',        '0700-CHOWLY-2');  -- id 2

-- ----------------------------------------------------------------------------
--  CUSTOMERS
-- ----------------------------------------------------------------------------
INSERT INTO customer (name, phone, email) VALUES
    ('Nnaemeka',  '0902208315', 'nnaemeka@gmail.com'),   -- id 1
    ('Chukwuma',  '08185025406','chukwuma@gmail.com'),   -- id 2
    ('Kachi',     '09038218812','kachi@hotmail.com'),    -- id 3
    ('Amarachi',  '07098417390','amarachi@yahoo.com');   -- id 4

-- ----------------------------------------------------------------------------
--  MENU ITEMS  - restaurant 1 gets 6 examples of each of the 5 menu_category
--  values (ids 1-30); restaurant 2 gets a smaller 2-per-category menu
--  (ids 31-40). Beef Suya, Shawarma, Zobo and French Fries keep their
--  original price/prep values since order_item below references them by
--  id to preserve the order-total reconciliation.
-- ----------------------------------------------------------------------------
INSERT INTO menu_item (restaurant_id, name, category, description, price_naira, avg_prep_minutes, is_available) VALUES
    -- restaurant 1 - starters
    (1, 'Beef Suya',           'starter', 'Grilled beef skewers with yaji spice',      3000, 15, TRUE),  -- id 1
    (1, 'Peppered Snails',     'starter', 'Snails sauteed in hot pepper sauce',        3500, 20, TRUE),  -- id 2
    (1, 'Spring Rolls',        'starter', 'Crispy vegetable spring rolls, 4 pieces',   1500, 10, TRUE),  -- id 3
    (1, 'Fish Roll',           'starter', 'Pastry-wrapped fish roll',                  1800, 12, TRUE),  -- id 4
    (1, 'Meat Pie',            'starter', 'Flaky pastry filled with minced meat',      1600, 12, TRUE),  -- id 5
    (1, 'Chicken Wings',       'starter', 'Grilled chicken wings, 6 pieces',           2800, 18, TRUE),  -- id 6
    -- restaurant 1 - mains
    (1, 'Shawarma',            'main',    'Seasoned diced meat and veggie wrap',       7000, 20, TRUE),  -- id 7
    (1, 'Jollof Rice',         'main',    'Smoky party jollof with fried plantain',    4500, 25, TRUE),  -- id 8
    (1, 'Egusi Soup & Pounded Yam', 'main', 'Melon-seed soup with pounded yam',        5500, 30, TRUE),  -- id 9
    (1, 'Fried Rice & Chicken','main',    'Vegetable fried rice with grilled chicken', 5000, 25, TRUE),  -- id 10
    (1, 'Native Rice & Fish',  'main',    'Palm-oil native rice with grilled fish',    5200, 28, TRUE),  -- id 11
    (1, 'Yam Porridge (Asaro)','main',    'Mashed yam porridge with palm oil sauce',   4200, 25, TRUE),  -- id 12
    -- restaurant 1 - desserts
    (1, 'Chin Chin',           'dessert', 'Sweet fried pastry cubes',                  1500,  5, TRUE),  -- id 13
    (1, 'Puff Puff',           'dessert', 'Sweet fried dough balls',                   1200,  8, TRUE),  -- id 14
    (1, 'Banana Fritters',     'dessert', 'Deep-fried sweet banana fritters',          1800, 10, TRUE),  -- id 15
    (1, 'Ice Cream Sundae',    'dessert', 'Vanilla ice cream with toppings',           2500,  5, TRUE),  -- id 16
    (1, 'Coconut Chips',       'dessert', 'Sweet toasted coconut chips',               1000,  5, TRUE),  -- id 17
    (1, 'Bread Pudding',       'dessert', 'Warm spiced bread pudding',                 1700, 10, TRUE),  -- id 18
    -- restaurant 1 - sides
    (1, 'French Fries',        'sides',   'Fried potato wedges with ketchup',          2500, 10, TRUE),  -- id 19
    (1, 'Fried Plantain',      'sides',   'Sweet fried plantain (dodo)',               2000, 10, TRUE),  -- id 20
    (1, 'Moin Moin',           'sides',   'Steamed bean pudding',                      1500, 15, TRUE),  -- id 21
    (1, 'Coleslaw',            'sides',   'Cabbage and carrot slaw',                   1500,  5, TRUE),  -- id 22
    (1, 'Sweet Potato Fries',  'sides',   'Fried sweet potato wedges',                 2000, 10, TRUE),  -- id 23
    (1, 'Mixed Vegetable Salad','sides',  'Fresh mixed vegetable salad',               1600,  8, TRUE),  -- id 24
    -- restaurant 1 - drinks
    (1, 'Zobo',                'drinks',  'Spiced hibiscus cordial, served cold',      2000,  5, TRUE),  -- id 25
    (1, 'Chapman',             'drinks',  'House cocktail mocktail, citrus & bitters', 2500,  6, TRUE),  -- id 26
    (1, 'Fresh Watermelon Juice','drinks','Chilled fresh watermelon juice',            2000,  5, TRUE),  -- id 27
    (1, 'Malt Drink',          'drinks',  'Chilled malt beverage',                     1200,  2, TRUE),  -- id 28
    (1, 'Pineapple Juice',     'drinks',  'Chilled fresh pineapple juice',             2000,  5, TRUE),  -- id 29
    (1, 'Coconut Water',       'drinks',  'Fresh chilled coconut water',               1500,  3, TRUE),  -- id 30
    -- restaurant 2
    (2, 'Samosa Platter',      'starter', 'Fried pastry parcels with spiced filling',  2000, 10, TRUE),  -- id 31
    (2, 'Chicken Suya Skewers','starter', 'Grilled chicken skewers with yaji spice',   3200, 15, TRUE),  -- id 32
    (2, 'Pepper Soup',         'main',    'Goat meat pepper soup',                     5000, 30, TRUE),  -- id 33
    (2, 'Ofada Rice & Ayamase','main',    'Local rice with spicy pepper sauce',        4800, 28, TRUE),  -- id 34
    (2, 'Coconut Candy',       'dessert', 'Chewy coconut and sugar candy',             1000,  5, TRUE),  -- id 35
    (2, 'Fruit Salad',         'dessert', 'Mixed seasonal fruit salad',                2000,  5, TRUE),  -- id 36
    (2, 'Garden Salad',        'sides',   'Fresh mixed garden salad',                  1800,  8, TRUE),  -- id 37
    (2, 'Yam Chips',           'sides',   'Fried yam chips with pepper sauce',         2200, 12, TRUE),  -- id 38
    (2, 'Palm Wine',           'drinks',  'Fresh tapped palm wine',                    1500,  3, TRUE),  -- id 39
    (2, 'Tiger Nut Milk',      'drinks',  'Chilled kunun aya (tiger nut milk)',        1800,  5, TRUE);  -- id 40

-- ----------------------------------------------------------------------------
--  STAFF  - restaurant 1
-- ----------------------------------------------------------------------------
INSERT INTO waiter (restaurant_id, name, phone, shift_schedule) VALUES
    (1, 'Ngozi', '09021147124', 'Morning'),   -- id 1
    (1, 'Femi',  '08033040145', 'Morning'),   -- id 2
    (1, 'Ade',   '07033768721', 'Evening'),   -- id 3
    (1, 'Etuk',  '09033499214', 'Morning'),   -- id 4
    (2, 'Bisi',  '08055512345', 'Evening');   -- id 5  (restaurant 2)

INSERT INTO chef (restaurant_id, name, specialty, phone) VALUES
    (1, 'Hassan', 'Grills',       '09045768922'),  -- id 1
    (1, 'Abike',  'Continental',  '08134758911'),  -- id 2
    (1, 'Essien', 'Noodles',      '07054628833'),  -- id 3
    (1, 'Yinka',  'Wraps',        '09098764523'),  -- id 4
    (2, 'Ovie',   'Soups',        '08066654321');  -- id 5  (restaurant 2)

INSERT INTO bartender (restaurant_id, name, specialty, phone) VALUES
    (1, 'Nengi',   'Cocktails', '09022088424'),  -- id 1
    (1, 'Kolofah', 'Mocktails', '08034572341'),  -- id 2
    (2, 'Tari',    'Local brews','08077765432'); -- id 3  (restaurant 2)

-- ----------------------------------------------------------------------------
--  ORDERS  (all for restaurant 1)
--  1 = OD001, 2 = OD002, 3 = OD003, 4 = OD004
-- ----------------------------------------------------------------------------
INSERT INTO orders (restaurant_id, customer_id, waiter_id, chef_id, bartender_id,
                    table_number, status, order_datetime,
                    estimated_wait_minutes, actual_wait_minutes, served_at) VALUES
    (1, 1, 4, 2, 1, 'T01', 'served',    TIMESTAMPTZ '2026-08-21 13:00+01', 25, 25,  TIMESTAMPTZ '2026-08-21 13:25+01'),  -- id 1
    (1, 2, 1, 4, 2, 'T20', 'preparing', TIMESTAMPTZ '2026-08-21 15:30+01', 20, NULL, NULL),                               -- id 2
    (1, 3, 2, 4, 2, 'T13', 'preparing', TIMESTAMPTZ '2026-08-21 16:00+01', 15, NULL, NULL),                               -- id 3
    (1, 4, 3, 3, 1, 'T18', 'served',    TIMESTAMPTZ '2026-08-21 18:00+01', 30, 35,  TIMESTAMPTZ '2026-08-21 18:35+01');  -- id 4

-- ----------------------------------------------------------------------------
--  ORDER ITEMS  (bridge table).  unit_price snapshot + prep times.
--  subtotal_naira is GENERATED, so we never insert it.
-- ----------------------------------------------------------------------------
INSERT INTO order_item (order_id, menu_item_id, quantity, unit_price_naira, prep_start_time, prep_end_time) VALUES
    -- Order 1 (served): 2x Shawarma (id 7) @7000 + 1x Zobo (id 25) @2000 = 16000
    (1, 7, 2, 7000, TIMESTAMPTZ '2026-08-21 13:02+01', TIMESTAMPTZ '2026-08-21 13:24+01'),
    (1, 25, 1, 2000, TIMESTAMPTZ '2026-08-21 13:02+01', TIMESTAMPTZ '2026-08-21 13:08+01'),
    -- Order 2 (preparing, DELAYED): 4x Beef Suya (id 1) @3000 = 12000. Started, never finished.
    (2, 1, 4, 3000, TIMESTAMPTZ '2026-08-21 15:32+01', NULL),
    -- Order 3 (preparing): 3x Beef Suya (id 1) @3000 = 9000
    (3, 1, 3, 3000, TIMESTAMPTZ '2026-08-21 16:03+01', NULL),
    -- Order 4 (served): 2x French Fries (id 19) @2500 = 5000
    (4, 19, 2, 2500, TIMESTAMPTZ '2026-08-21 18:05+01', TIMESTAMPTZ '2026-08-21 18:33+01');

-- ----------------------------------------------------------------------------
--  PAYMENTS  (correction #3: received_by_waiter_id)
--  Order 1 -> paid 16000 by waiter 4 (Etuk).  Order 4 -> paid 5000 by waiter 3 (Ade).
--  Both are marked pretend=TRUE per the brief.
-- ----------------------------------------------------------------------------
INSERT INTO payment (order_id, received_by_waiter_id, amount_naira, method, status, is_pretend, paid_at) VALUES
    (1, 4, 16000, 'cash', 'completed', TRUE, TIMESTAMPTZ '2026-08-21 13:30+01'),
    (4, 3,  5000, 'card', 'completed', TRUE, TIMESTAMPTZ '2026-08-21 18:38+01');

-- Reflect payment on the order status.
UPDATE orders SET status = 'paid' WHERE id IN (1, 4);

-- ----------------------------------------------------------------------------
--  COMPLAINTS  (correction #3: resolved_by_waiter_id)
-- ----------------------------------------------------------------------------
INSERT INTO complaint (order_id, customer_id, resolved_by_waiter_id, description, resolution_status, submitted_at, resolved_at) VALUES
    (2, 2, NULL, 'Order is taking too long',  'open',     TIMESTAMPTZ '2026-08-21 15:55+01', NULL),
    (4, 4, 3,    'Waiter was sluggish',       'resolved', TIMESTAMPTZ '2026-08-21 18:33+01', TIMESTAMPTZ '2026-08-21 18:40+01');

-- ----------------------------------------------------------------------------
--  RATINGS  (one per order)
-- ----------------------------------------------------------------------------
INSERT INTO rating (order_id, customer_id, rating_value, comment, submitted_at) VALUES
    (1, 1, 5, 'Excellent food and service',  TIMESTAMPTZ '2026-08-21 13:35+01'),
    (2, 2, 1, 'Service is very slow',         TIMESTAMPTZ '2026-08-21 15:59+01');

COMMIT;

-- ============================================================================
--  VERIFICATION - reproduces the feedback's reconciliation check.
-- ============================================================================
\echo ''
\echo 'Order totals vs payments (should match for orders 1 and 4):'
SELECT o.id AS order_id,
       o.status,
       SUM(oi.subtotal_naira) AS items_total,
       p.amount_naira          AS payment_amount,
       (SUM(oi.subtotal_naira) = p.amount_naira) AS reconciles
FROM   orders o
JOIN   order_item oi ON oi.order_id = o.id
LEFT   JOIN payment p ON p.order_id = o.id
GROUP  BY o.id, o.status, p.amount_naira
ORDER  BY o.id;

\echo ''
\echo 'Delayed order check (order 2: past estimate, no prep_end_time, open complaint):'
SELECT o.id AS order_id, o.estimated_wait_minutes, o.status,
       oi.prep_start_time, oi.prep_end_time,
       c.resolution_status AS complaint, r.rating_value AS rating
FROM   orders o
JOIN   order_item oi ON oi.order_id = o.id
LEFT   JOIN complaint c ON c.order_id = o.id
LEFT   JOIN rating r   ON r.order_id = o.id
WHERE  o.id = 2;

\echo ''
\echo 'Seed complete.'
