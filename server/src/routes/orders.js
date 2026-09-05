import express from 'express';
import { pool, query } from '../db.js';
import { RESTAURANT_ID, BAR_CATEGORIES } from '../config.js';
import { requireCustomer, requireWaiter } from '../middleware.js';

const router = express.Router();

// ---------------------------------------------------------------------------
//  Shared: load one order with everything hanging off it
// ---------------------------------------------------------------------------
async function loadOrderDetail(orderId) {
  const { rows: [order] } = await query(
    `SELECT o.id, o.table_number, o.status, o.order_datetime,
            o.estimated_wait_minutes, o.actual_wait_minutes, o.served_at,
            o.customer_id, o.waiter_id, o.chef_id, o.bartender_id,
            c.name  AS customer_name,
            w.name  AS waiter_name,
            ch.name AS chef_name,
            b.name  AS bartender_name
     FROM   orders o
     JOIN   customer c      ON c.id  = o.customer_id
     LEFT   JOIN waiter w   ON w.id  = o.waiter_id
     LEFT   JOIN chef ch    ON ch.id = o.chef_id
     LEFT   JOIN bartender b ON b.id = o.bartender_id
     WHERE  o.id = $1 AND o.restaurant_id = $2`,
    [orderId, RESTAURANT_ID],
  );
  if (!order) return null;

  const { rows: items } = await query(
    `SELECT oi.id, oi.quantity,
            oi.unit_price_naira::float8 AS unit_price_naira,
            oi.subtotal_naira::float8   AS subtotal_naira,
            oi.prep_start_time, oi.prep_end_time,
            mi.name, mi.category
     FROM   order_item oi
     JOIN   menu_item mi ON mi.id = oi.menu_item_id
     WHERE  oi.order_id = $1
     ORDER  BY mi.category, mi.name`,
    [orderId],
  );

  const [{ rows: [payment] }, { rows: [complaint] }, { rows: [rating] }] = await Promise.all([
    query(`SELECT id, amount_naira::float8 AS amount_naira, method, status,
                  is_pretend, paid_at, received_by_waiter_id
           FROM payment WHERE order_id = $1`, [orderId]),
    query(`SELECT id, description, resolution_status, submitted_at, resolved_at,
                  resolved_by_waiter_id
           FROM complaint WHERE order_id = $1
           ORDER BY submitted_at DESC LIMIT 1`, [orderId]),
    query(`SELECT id, rating_value, comment, submitted_at
           FROM rating WHERE order_id = $1`, [orderId]),
  ]);

  const total = items.reduce((sum, i) => sum + Number(i.subtotal_naira), 0);
  return {
    order,
    items,
    payment: payment || null,
    complaint: complaint || null,
    rating: rating || null,
    total,
  };
}

// ---------------------------------------------------------------------------
//  Customer: place an order
// ---------------------------------------------------------------------------
router.post('/orders', requireCustomer, async (req, res, next) => {
  const requested = (Array.isArray(req.body.items) ? req.body.items : [])
    .map((i) => ({ menuItemId: parseInt(i.menuItemId, 10), qty: parseInt(i.qty, 10) }))
    .filter((i) => i.menuItemId > 0 && i.qty > 0);

  if (requested.length === 0) {
    return res.status(400).json({ error: 'Add at least one item before placing the order.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ids = requested.map((r) => r.menuItemId);
    const { rows: menuRows } = await client.query(
      `SELECT id, price_naira, avg_prep_minutes, category
       FROM   menu_item
       WHERE  id = ANY($1) AND restaurant_id = $2 AND is_available = TRUE`,
      [ids, RESTAURANT_ID],
    );
    const byId = new Map(menuRows.map((m) => [m.id, m]));
    if (byId.size !== ids.length) {
      throw Object.assign(new Error('One of those items is no longer available.'), { status: 409 });
    }

    // Kitchen and bar prepare in parallel, so the wait is the longer queue.
    let kitchenMinutes = 0;
    let barMinutes = 0;
    for (const line of requested) {
      const m = byId.get(line.menuItemId);
      const minutes = m.avg_prep_minutes * line.qty;
      if (BAR_CATEGORIES.has(m.category)) barMinutes += minutes;
      else kitchenMinutes += minutes;
    }
    const estimatedWait = Math.max(kitchenMinutes, barMinutes);

    const { rows: [order] } = await client.query(
      `INSERT INTO orders (restaurant_id, customer_id, table_number, status, estimated_wait_minutes)
       VALUES ($1, $2, $3, 'pending', $4)
       RETURNING id`,
      [RESTAURANT_ID, req.session.customerId, req.session.tableNumber, estimatedWait],
    );

    for (const line of requested) {
      const m = byId.get(line.menuItemId);
      await client.query(
        `INSERT INTO order_item (order_id, menu_item_id, quantity, unit_price_naira)
         VALUES ($1, $2, $3, $4)`,
        [order.id, line.menuItemId, line.qty, m.price_naira],
      );
    }

    await client.query('COMMIT');
    req.session.currentOrderId = order.id;
    res.status(201).json({ orderId: order.id });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
//  Order detail (either role - the customer polls it, the waiter opens it)
// ---------------------------------------------------------------------------
router.get('/orders/:id', async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (!orderId) return res.status(404).json({ error: 'Not found' });
    const detail = await loadOrderDetail(orderId);
    if (!detail) return res.status(404).json({ error: 'Not found' });
    res.json(detail);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
//  Waiter: the order board
// ---------------------------------------------------------------------------
router.get('/waiter/orders', requireWaiter, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT o.id, o.table_number, o.status, o.order_datetime,
              o.estimated_wait_minutes, o.actual_wait_minutes,
              c.name  AS customer_name,
              w.name  AS waiter_name,
              ch.name AS chef_name,
              b.name  AS bartender_name,
              COALESCE(t.total, 0)::float8 AS total,
              COALESCE(cp.open_complaints, 0)::int AS open_complaints
       FROM   orders o
       JOIN   customer c       ON c.id  = o.customer_id
       LEFT   JOIN waiter w    ON w.id  = o.waiter_id
       LEFT   JOIN chef ch     ON ch.id = o.chef_id
       LEFT   JOIN bartender b ON b.id  = o.bartender_id
       LEFT   JOIN LATERAL (
               SELECT SUM(oi.subtotal_naira) AS total
               FROM order_item oi WHERE oi.order_id = o.id
             ) t ON TRUE
       LEFT   JOIN LATERAL (
               SELECT COUNT(*) AS open_complaints
               FROM complaint cc
               WHERE cc.order_id = o.id AND cc.resolution_status = 'open'
             ) cp ON TRUE
       WHERE  o.restaurant_id = $1
       ORDER  BY
         CASE o.status WHEN 'pending' THEN 0 WHEN 'preparing' THEN 1
                       WHEN 'served' THEN 2 WHEN 'paid' THEN 3 ELSE 4 END,
         o.order_datetime DESC`,
      [RESTAURANT_ID],
    );
    res.json({ orders: rows });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
//  Waiter: assign staff -> the order starts being prepared
// ---------------------------------------------------------------------------
router.post('/orders/:id/assign', requireWaiter, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const orderId = parseInt(req.params.id, 10);
    const waiterId = parseInt(req.body.waiterId, 10);
    const chefId = parseInt(req.body.chefId, 10);
    const bartenderId = parseInt(req.body.bartenderId, 10);
    if (!waiterId || !chefId || !bartenderId) {
      return res.status(400).json({ error: 'Pick a waiter, a chef and a bartender.' });
    }

    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE orders
       SET waiter_id = $1, chef_id = $2, bartender_id = $3, status = 'preparing'
       WHERE id = $4 AND restaurant_id = $5 AND status = 'pending'
       RETURNING id`,
      [waiterId, chefId, bartenderId, orderId, RESTAURANT_ID],
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'That order is not waiting to be assigned.' });
    }
    // Correction #2: prep timing is recorded per item.
    await client.query(
      `UPDATE order_item SET prep_start_time = now()
       WHERE order_id = $1 AND prep_start_time IS NULL`,
      [orderId],
    );
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
//  Waiter: mark served
// ---------------------------------------------------------------------------
router.post('/orders/:id/serve', requireWaiter, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const orderId = parseInt(req.params.id, 10);
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE orders
       SET status = 'served',
           served_at = now(),
           actual_wait_minutes = GREATEST(0, ROUND(EXTRACT(EPOCH FROM (now() - order_datetime)) / 60))::int
       WHERE id = $1 AND restaurant_id = $2 AND status = 'preparing'
       RETURNING id`,
      [orderId, RESTAURANT_ID],
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'That order is not being prepared.' });
    }
    await client.query(
      `UPDATE order_item SET prep_end_time = now()
       WHERE order_id = $1 AND prep_end_time IS NULL`,
      [orderId],
    );
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

export { loadOrderDetail };
export default router;
