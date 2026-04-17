// middleware/auth.js
// ─────────────────────────────────────────────────────────────
//  This is a GATEKEEPER.  Any route that needs a logged-in
//  user puts this middleware first.  It reads the token from
//  the request header, checks it's real, then passes through.
// ─────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // Token arrives in the header like:  Authorization: Bearer eyJhb...
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorised — please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;   // attach user info so routes can use req.user.id
    next();               // all good — continue to the actual route
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired.' });
  }
};

// Admin-only gatekeeper (call AFTER protect)
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
};

module.exports = { protect, adminOnly };