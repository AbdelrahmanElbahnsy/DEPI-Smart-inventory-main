import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../config/env.js';
import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Generate an access token (short-lived, 15 min)
 */
const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: '15m',
  });
};

/**
 * Generate a refresh token (long-lived, 7 days)
 */
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, type: 'refresh' }, config.jwtRefreshSecret, {
    expiresIn: '7d',
  });
};

/**
 * Build the auth response payload (used in login & register)
 */
const buildAuthResponse = (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    token: accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
  };
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) throw ApiError.badRequest('Email already registered');

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, role: role || 'staff' });

    const data = buildAuthResponse(user);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) throw ApiError.unauthorized('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw ApiError.unauthorized('Invalid credentials');

    const data = buildAuthResponse(user);
    res.json({
      success: true,
      message: 'Login successful',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
};

/**
 * Refresh endpoint — accepts a valid refresh token and issues a new access token.
 * The old access token may already be expired; only the refresh token matters.
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: incomingRefreshToken } = req.body;

    if (!incomingRefreshToken) {
      throw ApiError.badRequest('Refresh token is required');
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(incomingRefreshToken, config.jwtRefreshSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Refresh token expired — please log in again');
      }
      throw ApiError.unauthorized('Invalid refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw ApiError.unauthorized('Invalid token type');
    }

    // Look up the user to ensure they still exist and are active
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }

    // Issue brand-new pair
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    next(error);
  }
};
