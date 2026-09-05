// Role guards. There is no login - the client just declares which role it is
// acting as via POST /api/session/*, and the choice lives in the session cookie.

export function requireCustomer(req, res, next) {
  if (req.session?.role !== 'customer') {
    return res.status(401).json({ error: 'Switch to the customer view first.' });
  }
  next();
}

export function requireWaiter(req, res, next) {
  if (req.session?.role !== 'waiter') {
    return res.status(401).json({ error: 'Switch to the waiter view first.' });
  }
  next();
}
