import { ApiError } from '../utils/ApiError.js';

/**
 * Role hierarchy (highest → lowest):
 *   owner > manager > security > staff
 *
 * authorize(...allowedRoles) — only allows listed roles.
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }
    next();
  };
};

/**
 * Prevents DELETE method — used for staff role (can create/update but not delete).
 */
export const noDelete = (req, res, next) => {
  if (req.user?.role === 'staff' && req.method === 'DELETE') {
    return next(ApiError.forbidden('Staff members cannot perform delete operations'));
  }
  next();
};

/**
 * Security role can only perform GET requests (read-only monitoring).
 */
export const readOnly = (req, res, next) => {
  if (req.user?.role === 'security' && req.method !== 'GET') {
    return next(ApiError.forbidden('Security role has read-only access'));
  }
  next();
};
