import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ─── Role hierarchy for permission checks ─── */
const ROLE_LEVEL = { owner: 100, manager: 50, security: 20, staff: 10 };

/**
 * GET /api/users — list all users (Owner sees all, Manager sees Staff+Security).
 */
export const getUsers = async (req, res, next) => {
  try {
    const whereClause = {};
    // Manager can only see staff & security users (not owners or other managers)
    if (req.user.role === 'manager') {
      whereClause.role = ['staff', 'security'];
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: { users } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users — create a new user.
 *  - Owner can create any role.
 *  - Manager can only create staff & security.
 */
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Manager cannot create owner or manager
    if (req.user.role === 'manager' && (role === 'owner' || role === 'manager')) {
      throw ApiError.forbidden('Managers can only create Staff or Security users');
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) throw ApiError.badRequest('Email already exists');

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role || 'staff',
      phone: phone || null,
    });

    res.status(201).json({
      success: true,
      message: 'User created',
      data: {
        user: {
          id: user.id, name: user.name, email: user.email,
          role: user.role, avatar: user.avatar, phone: user.phone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id — update a user.
 *  - Owner can update anyone.
 *  - Manager can only update staff & security (cannot touch owner).
 */
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw ApiError.notFound('User not found');

    // Manager cannot edit an owner
    if (req.user.role === 'manager' && user.role === 'owner') {
      throw ApiError.forbidden('Managers cannot modify Owner accounts');
    }
    // Manager cannot edit another manager
    if (req.user.role === 'manager' && user.role === 'manager') {
      throw ApiError.forbidden('Managers cannot modify other Manager accounts');
    }

    const { name, email, role, phone } = req.body;

    // Manager cannot promote someone to owner or manager
    if (req.user.role === 'manager' && (role === 'owner' || role === 'manager')) {
      throw ApiError.forbidden('Managers can only assign Staff or Security roles');
    }

    await user.update({
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      ...(phone !== undefined && { phone }),
    });

    res.json({
      success: true,
      message: 'User updated',
      data: {
        user: {
          id: user.id, name: user.name, email: user.email,
          role: user.role, avatar: user.avatar, phone: user.phone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id — delete a user.
 *  - Only Owner can delete.
 *  - Cannot delete yourself.
 *  - Cannot delete the last Owner (system needs at least one).
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw ApiError.notFound('User not found');
    if (user.id === req.user.id) throw ApiError.badRequest('Cannot delete yourself');

    // If deleting an owner, ensure at least one remains
    if (user.role === 'owner') {
      const ownerCount = await User.count({ where: { role: 'owner' } });
      if (ownerCount <= 1) {
        throw ApiError.badRequest('Cannot delete the last Owner in the system');
      }
    }

    await user.destroy();
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/profile — update own profile (name, email, avatar).
 * ⚠️  CRITICAL: Strips role/password from body — users cannot self-promote.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) throw ApiError.notFound('User not found');

    const { name, email } = req.body;
    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (email && email.trim()) updates.email = email.trim();

    // ⚠️  Never allow role change through profile endpoint
    // req.body.role is intentionally ignored

    // Handle avatar file upload
    if (req.file) {
      // Delete old avatar if it exists and is a local file
      if (user.avatar && user.avatar.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', '..', user.avatar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    await user.update(updates);

    res.json({
      success: true,
      message: 'Profile updated',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/password — change own password.
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('Current password and new password are required');
    }
    if (newPassword.length < 6) {
      throw ApiError.badRequest('New password must be at least 6 characters');
    }

    const user = await User.findByPk(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
