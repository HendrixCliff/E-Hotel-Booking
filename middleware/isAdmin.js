module.exports = function isAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Admin access only' });
};
