import express from 'express';
import { query } from '../db.js';
import { RESTAURANT_ID } from '../config.js';

const router = express.Router();

async function currentRestaurant() {
  const { rows } = await query(
    'SELECT id, name, address, phone FROM restaurant WHERE id = $1',
    [RESTAURANT_ID],
  );
  return rows[0] || null;
}

// Who am I acting as right now? Called on every client load.
router.get('/me', async (req, res, next) => {
  try {
    res.json({
      role: req.session.role || null,
      customerId: req.session.customerId || null,
      customerName: req.session.customerName || null,
      tableNumber: req.session.tableNumber || null,
      currentOrderId: req.session.currentOrderId || null,
      restaurant: await currentRestaurant(),
    });
  } catch (err) {
    next(err);
  }
});

// Start acting as a customer. Creates the customer row up front so the person
// has an identity even before they place an order.
router.post('/session/customer', async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim() || 'Guest';
    const tableNumber = (req.body.tableNumber || '').trim();
    if (!tableNumber) return res.status(400).json({ error: 'Table number is required.' });

    const phone = (req.body.phone || '').trim() || null;
    const email = (req.body.email || '').trim() || null;
    const { rows } = await query(
      'INSERT INTO customer (name, phone, email) VALUES ($1, $2, $3) RETURNING id',
      [name, phone, email],
    );

    req.session.role = 'customer';
    req.session.customerId = rows[0].id;
    req.session.customerName = name;
    req.session.tableNumber = tableNumber;
    req.session.currentOrderId = null;
    res.json({ ok: true, customerId: rows[0].id });
  } catch (err) {
    next(err);
  }
});

// The Customer / Waiter toggle. Only flips which view you see - a customer's
// identity and current order are kept, so switching to the waiter view to
// check on things and back does not lose the order.
router.post('/session/role', (req, res) => {
  const role = req.body.role === 'waiter' ? 'waiter' : 'customer';
  req.session.role = role;
  res.json({ ok: true, role });
});

// Full reset - forget the customer identity and start a fresh visit.
router.post('/session/switch', (req, res) => {
  req.session.role = null;
  req.session.customerId = null;
  req.session.customerName = null;
  req.session.tableNumber = null;
  req.session.currentOrderId = null;
  res.json({ ok: true });
});

export default router;
