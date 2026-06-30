const { ROLES } = require('../utils/constants');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (req.user.role === ROLES.SUPER_ADMIN) return next();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

const requireAdmin = requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN);
const requireSuperAdmin = requireRole(ROLES.SUPER_ADMIN);

module.exports = { requireRole, requireAdmin, requireSuperAdmin };
