const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Note = require('../models/Note');
const { protect } = require('../middleware/auth');
const { requireAdmin, requireSuperadmin, canSuspend } = require('../middleware/rbac');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin / Superadmin)
router.get('/users', protect, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    return res.status(200).json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/users/create
// @desc    Create a new user with any role (superadmin only)
// @access  Private (Superadmin only)
router.post('/users/create', protect, requireSuperadmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const validRoles = ['user', 'admin', 'superadmin'];
    const assignedRole = (role && validRoles.includes(role)) ? role : 'user';

    const existingUser = await User.findOne({
      $or: [
        { username: username.trim().toLowerCase() },
        { email: email.trim().toLowerCase() },
      ],
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already in use' });
    }

    const user = new User({
      username,
      email,
      passwordHash: password,
      role: assignedRole,
    });

    await user.save();

    return res.status(201).json({
      message: 'User created',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user by ID
// @access  Private (Admin / Superadmin)
router.get('/users/:id', protect, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/users/:id/suspend
// @desc    Suspend a user
// @access  Private (Admin / Superadmin)
router.post('/users/:id/suspend', protect, requireAdmin, async (req, res) => {
  try {
    const { duration, reason } = req.body;
    const validDurations = ['2h', '24h', '48h', 'permanent'];

    if (!duration || !validDurations.includes(duration)) {
      return res.status(400).json({ message: 'Invalid suspension duration' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser._id.toString() === req.user.userId.toString()) {
      return res.status(400).json({ message: 'You cannot suspend yourself' });
    }

    if (!canSuspend(req.user.role, targetUser.role)) {
      return res.status(403).json({ message: 'You do not have permission to suspend this user' });
    }

    const now = Date.now();
    let until = null;
    let isPermanent = false;

    if (duration === '2h') {
      until = new Date(now + 2 * 60 * 60 * 1000);
    } else if (duration === '24h') {
      until = new Date(now + 24 * 60 * 60 * 1000);
    } else if (duration === '48h') {
      until = new Date(now + 48 * 60 * 60 * 1000);
    } else if (duration === 'permanent') {
      isPermanent = true;
      until = null;
    }

    targetUser.suspension = {
      active: true,
      until,
      isPermanent,
      reason: reason || '',
      suspendedBy: req.user.userId,
      suspendedAt: new Date(),
    };

    await targetUser.save();

    return res.status(200).json({
      message: 'User suspended',
      user: {
        id: targetUser._id,
        username: targetUser.username,
        suspension: targetUser.suspension,
      },
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/users/:id/unsuspend
// @desc    Clear suspension for a user
// @access  Private (Admin / Superadmin)
router.post('/users/:id/unsuspend', protect, requireAdmin, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.suspension && targetUser.suspension.isPermanent && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only a superadmin can clear a permanent suspension' });
    }

    targetUser.suspension = {
      active: false,
      until: null,
      isPermanent: false,
      reason: '',
      suspendedBy: null,
      suspendedAt: null,
    };

    await targetUser.save();

    return res.status(200).json({
      message: 'Suspension cleared',
      user: {
        id: targetUser._id,
        username: targetUser.username,
        suspension: targetUser.suspension,
      },
    });
  } catch (error) {
    console.error('Unsuspend user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Superadmin only)
router.post('/users/:id/role', protect, requireSuperadmin, async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'admin', 'superadmin'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    targetUser.role = role;
    await targetUser.save();

    return res.status(200).json({
      message: 'Role updated',
      user: {
        id: targetUser._id,
        username: targetUser.username,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users/:id/notes
// @desc    Get all notes authored by a specific user (admin can see private notes too)
// @access  Private (Admin / Superadmin)
router.get('/users/:id/notes', protect, requireAdmin, async (req, res) => {
  try {
    const notes = await Note.find({
      authorId: req.params.id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ notes });
  } catch (error) {
    console.error('Get user notes (admin) error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/notes/:id
// @desc    Admin soft-delete a note
// @access  Private (Admin / Superadmin)
router.delete('/notes/:id', protect, requireAdmin, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note || note.isDeleted) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.isDeleted = true;
    await note.save();

    return res.status(200).json({ message: 'Note deleted by admin' });
  } catch (error) {
    console.error('Admin delete note error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
