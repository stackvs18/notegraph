/**
 * RBAC (Role-Based Access Control) & Ownership Middleware Helpers
 */

/**
 * Middleware factory requiring specific user roles
 * @param  {...string} allowedRoles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

/**
 * Shorthand middleware for admin and superadmin roles
 */
const requireAdmin = requireRole('admin', 'superadmin');

/**
 * Shorthand middleware for superadmin role only
 */
const requireSuperadmin = requireRole('superadmin');

/**
 * Middleware factory for resource ownership or admin bypass
 * @param {Function} getResourceOwnerId - Async function returning resource owner ObjectId/string or null
 */
const ownerOrAdmin = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        return next();
      }

      const ownerId = await getResourceOwnerId(req);

      if (ownerId === null || ownerId === undefined) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      if (ownerId.toString() !== req.user.userId.toString()) {
        return res.status(403).json({ message: 'You do not own this resource' });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({ message: 'Server error checking ownership' });
    }
  };
};

/**
 * Helper function to determine if an acting role can suspend a target role
 * @param {string} actingUserRole
 * @param {string} targetUserRole
 * @returns {boolean}
 */
const canSuspend = (actingUserRole, targetUserRole) => {
  if (actingUserRole === 'superadmin') {
    return targetUserRole === 'user' || targetUserRole === 'admin';
  }
  if (actingUserRole === 'admin') {
    return targetUserRole === 'user';
  }
  return false;
};

module.exports = {
  requireRole,
  requireAdmin,
  requireSuperadmin,
  ownerOrAdmin,
  canSuspend,
};
