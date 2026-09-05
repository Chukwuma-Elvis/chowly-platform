import express from 'express';
import { query } from '../db.js';
import { RESTAURANT_ID } from '../config.js';
import { requireWaiter } from '../middleware.js';

const router = express.Router();

// The full available menu for the active venue. The client groups it by
// category and derives the category counts, so one round trip is enough.
router.get('/menu', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, category, description, image_url,
              price_naira::float8   AS price_naira,
              avg_prep_minutes
       FROM   menu_item
       WHERE  restaurant_id = $1 AND is_available = TRUE
       ORDER  BY category, name`,
      [RESTAURANT_ID],
    );
    res.json({ items: rows });
  } catch (err) {
    next(err);
  }
});

// Staff lists that fill the waiter's assignment dropdowns.
router.get('/staff', requireWaiter, async (req, res, next) => {
  try {
    const [waiters, chefs, bartenders] = await Promise.all([
      query('SELECT id, name FROM waiter    WHERE restaurant_id = $1 ORDER BY name', [RESTAURANT_ID]),
      query('SELECT id, name, specialty FROM chef      WHERE restaurant_id = $1 ORDER BY name', [RESTAURANT_ID]),
      query('SELECT id, name, specialty FROM bartender WHERE restaurant_id = $1 ORDER BY name', [RESTAURANT_ID]),
    ]);
    res.json({ waiters: waiters.rows, chefs: chefs.rows, bartenders: bartenders.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
