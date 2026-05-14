const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_secret');
    const user = await User.findOne({ _id: decoded.id, isDeleted: false }).select('_id email role fullName');
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists.' });
    req.user = { id: user._id.toString(), email: user.email, role: user.role, fullName: user.fullName };
    next();
  } catch (_err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
  }
  next();
};

module.exports = { authenticate, authorize };
