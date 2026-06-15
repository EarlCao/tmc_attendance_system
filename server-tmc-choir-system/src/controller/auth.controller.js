import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { createAuditLog } from '../lib/auditLogger.js';

// Helper function to sign JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Helper function to create and send token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  // Remove password from output
  user.passwordHash = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1) Check if username and password exist
    if (!username || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide username and password',
      });
    }

    // 2) Check if user exists && password is correct
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      // Log failed login attempt
      await createAuditLog({
        userId: user?.id || null,
        username: username,
        action: 'LOGIN_FAILED',
        category: 'AUTH',
        target: `user:${username}`,
        details: { reason: 'Incorrect username or password' },
        ipAddress: req.ip,
      });

      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect username or password',
      });
    }

    // 3) Log successful login
    await createAuditLog({
      userId: user.id,
      username: user.username,
      action: 'LOGIN',
      category: 'AUTH',
      target: `user:${user.username}`,
      details: { role: user.role },
      ipAddress: req.ip,
    });

    // 4) Send token to client
    createSendToken(user, 200, res);
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const logout = async (req, res) => {
  try {
    await createAuditLog({
      userId: req.user.id,
      username: req.user.username,
      action: 'LOGOUT',
      category: 'AUTH',
      target: `user:${req.user.username}`,
      details: { role: req.user.role },
      ipAddress: req.ip,
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (err) {
    console.error('Logout Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

// For simplicity, we are not implementing email verification or other checks here
export const getMe = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
};
