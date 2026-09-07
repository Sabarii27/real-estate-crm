const ApiError = require('../utils/ApiError');

// Usage: authorize('admin') or authorize('admin', 'sales')
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authorized. Please log in.');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action.');
    }
    next();
  };
};

module.exports = { authorize };
