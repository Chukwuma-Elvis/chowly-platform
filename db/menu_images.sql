-- ============================================================================
--  MENU IMAGES  (optional)
-- ----------------------------------------------------------------------------
--  menu_item.image_url is nullable. When it is set the menu card shows the
--  photo; when it is NULL the card falls back to a category-tinted band.
--
--  Two ways to point at an image:
--
--   1. A file you drop in  client/public/menu/  -> use a root-relative path,
--      e.g.  '/menu/beef-suya.jpg'   (works in dev and in the production build)
--
--   2. A full URL to an image hosted elsewhere,
--      e.g.  'https://example.com/photos/jollof.jpg'
--
--  Run it after the seed:   node db/setup.mjs --images
--  (db/setup.mjs with no argument runs schema -> seed -> this file.)
--
--  Re-running is safe: it only UPDATEs, matched by restaurant + name.
-- ============================================================================

-- ---- Restaurant 1 -----------------------------------------------------------
-- A few placeholders so you can see the card layout with a photo. Replace the
-- URLs with real dish photos (or local /menu/*.jpg paths).

UPDATE menu_item SET image_url = '/menu/beef-suya.jpg'
  WHERE restaurant_id = 1 AND name = 'Beef Suya';
UPDATE menu_item SET image_url = 'https://picsum.photos/seed/jollof/640/480'
  WHERE restaurant_id = 1 AND name = 'Jollof Rice';
UPDATE menu_item SET image_url = 'https://picsum.photos/seed/shawarma/640/480'
  WHERE restaurant_id = 1 AND name = 'Shawarma';
UPDATE menu_item SET image_url = 'https://picsum.photos/seed/zobo/640/480'
  WHERE restaurant_id = 1 AND name = 'Zobo';
UPDATE menu_item SET image_url = 'https://picsum.photos/seed/chapman/640/480'
  WHERE restaurant_id = 1 AND name = 'Chapman';
UPDATE menu_item SET image_url = 'https://picsum.photos/seed/puffpuff/640/480'
  WHERE restaurant_id = 1 AND name = 'Puff Puff';

-- ---- Template: local files in client/public/menu/ --------------------------
-- Uncomment a line, drop the matching file in client/public/menu/, done.

-- UPDATE menu_item SET image_url = '/menu/peppered-snails.jpg'  WHERE restaurant_id = 1 AND name = 'Peppered Snails';
-- UPDATE menu_item SET image_url = '/menu/spring-rolls.jpg'     WHERE restaurant_id = 1 AND name = 'Spring Rolls';
-- UPDATE menu_item SET image_url = '/menu/fish-roll.jpg'        WHERE restaurant_id = 1 AND name = 'Fish Roll';
-- UPDATE menu_item SET image_url = '/menu/meat-pie.jpg'         WHERE restaurant_id = 1 AND name = 'Meat Pie';
-- UPDATE menu_item SET image_url = '/menu/chicken-wings.jpg'    WHERE restaurant_id = 1 AND name = 'Chicken Wings';
-- UPDATE menu_item SET image_url = '/menu/egusi.jpg'            WHERE restaurant_id = 1 AND name = 'Egusi Soup & Pounded Yam';
-- UPDATE menu_item SET image_url = '/menu/fried-rice.jpg'       WHERE restaurant_id = 1 AND name = 'Fried Rice & Chicken';
-- UPDATE menu_item SET image_url = '/menu/native-rice.jpg'      WHERE restaurant_id = 1 AND name = 'Native Rice & Fish';
-- UPDATE menu_item SET image_url = '/menu/asaro.jpg'            WHERE restaurant_id = 1 AND name = 'Yam Porridge (Asaro)';
-- UPDATE menu_item SET image_url = '/menu/chin-chin.jpg'        WHERE restaurant_id = 1 AND name = 'Chin Chin';
-- UPDATE menu_item SET image_url = '/menu/banana-fritters.jpg'  WHERE restaurant_id = 1 AND name = 'Banana Fritters';
-- UPDATE menu_item SET image_url = '/menu/ice-cream.jpg'        WHERE restaurant_id = 1 AND name = 'Ice Cream Sundae';
-- UPDATE menu_item SET image_url = '/menu/fried-plantain.jpg'   WHERE restaurant_id = 1 AND name = 'Fried Plantain';
-- UPDATE menu_item SET image_url = '/menu/moin-moin.jpg'        WHERE restaurant_id = 1 AND name = 'Moin Moin';
-- UPDATE menu_item SET image_url = '/menu/coleslaw.jpg'         WHERE restaurant_id = 1 AND name = 'Coleslaw';
-- UPDATE menu_item SET image_url = '/menu/french-fries.jpg'     WHERE restaurant_id = 1 AND name = 'French Fries';
-- UPDATE menu_item SET image_url = '/menu/watermelon-juice.jpg' WHERE restaurant_id = 1 AND name = 'Fresh Watermelon Juice';
-- UPDATE menu_item SET image_url = '/menu/malt.jpg'             WHERE restaurant_id = 1 AND name = 'Malt Drink';

\echo 'menu_images.sql applied.'
