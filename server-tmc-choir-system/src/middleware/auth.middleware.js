import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

/**
 * Middleware to protect routes and ensure the user is authenticated
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1) Get token and check if it exists
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.',
      });
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // 4) Check if user is still active
    if (!currentUser.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'This user account is currently inactive.',
      });
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    // Never expose the password hash on the request context (it would leak via
    // /api/auth/me and anywhere req.user is serialized).
    const { passwordHash, ...safeUser } = currentUser;
    req.user = safeUser;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid token. Please log in again!',
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Your token has expired! Please log in again.',
      });
    }
    
    console.error('Auth Middleware Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong while authenticating.',
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user.role || req.user.role.toUpperCase() !== 'ADMIN') {
    return res.status(403).json({
      status: 'fail',
      message: 'You do not have permission to perform this action',
    });
  }
  next();
};

/**
 * Middleware to restrict access to certain roles
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'editor')
 */
export const restrictTo = (...roles) => {
  const upperRoles = roles.map(role => role.toUpperCase());
  return (req, res, next) => {
    if (!req.user.role || !upperRoles.includes(req.user.role.toUpperCase())) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action',
      });
    }

    next();
  };
};
