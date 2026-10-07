const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const Note = require('../models/Note');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { ownerOrAdmin } = require('../middleware/rbac');

// Helper for ownerOrAdmin middleware
const getNoteOwnerId = async (req) => {
  const note = await Note.findById(req.params.id);
  return note ? note.authorId.toString() : null;
};

// @route   GET /api/notes/public
// @desc    Get all permanent public notes (admin/superadmin only — user notes are shareable by direct link only)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const notes = await Note.find({
      visibility: 'public',
      isDeleted: false,
      isPermanent: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ notes });
  } catch (error) {
    console.error('Get public notes error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notes/public/:nanoid
// @desc    Get a single public note by nanoid
// @access  Public
router.get('/public/:nanoid', async (req, res) => {
  try {
    const note = await Note.findOne({
      nanoid: req.params.nanoid,
      visibility: 'public',
      isDeleted: false,
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (!note.isPermanent && note.expiresAt && new Date(note.expiresAt) <= new Date()) {
      return res.status(410).json({ message: 'Note has expired' });
    }

    return res.status(200).json({ note });
  } catch (error) {
    console.error('Get public note by nanoid error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notes/my
// @desc    Get current user\'s notes (including active/expired, excluding deleted)
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const notes = await Note.find({
      authorId: req.user.userId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ notes });
  } catch (error) {
    console.error('Get my notes error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notes/:id
// @desc    Get a single note by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, isDeleted: false });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.visibility === 'private') {
      const isOwner = note.authorId.toString() === req.user.userId.toString();
      const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized to view this note' });
      }
    }

    return res.status(200).json({ note });
  } catch (error) {
    console.error('Get note by ID error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notes
// @desc    Create a new note
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, body, visibility, tags } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const user = await User.findById(req.user.userId).select('username');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validVisibility = ['public', 'private'].includes(visibility) ? visibility : 'private';

    const processedTags = Array.isArray(tags)
      ? tags.map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : '')).filter(Boolean)
      : [];

    const noteNanoid = nanoid(8);

    const note = new Note({
      title: title.trim(),
      body: body || '',
      visibility: validVisibility,
      authorId: req.user.userId,
      authorName: user.username,
      authorRole: req.user.role,
      tags: processedTags,
      nanoid: noteNanoid,
    });

    await note.save();

    return res.status(201).json({ note });
  } catch (error) {
    console.error('Create note error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notes/:id
// @desc    Update a note
// @access  Private (Owner / Admin)
router.put('/:id', protect, ownerOrAdmin(getNoteOwnerId), async (req, res) => {
  try {
    const { title, body, visibility, tags } = req.body;

    const note = await Note.findOne({ _id: req.params.id, isDeleted: false });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (title !== undefined && typeof title === 'string') {
      if (!title.trim()) {
        return res.status(400).json({ message: 'Title cannot be empty' });
      }
      note.title = title.trim();
    }

    if (body !== undefined) {
      note.body = body;
    }

    if (visibility !== undefined && ['public', 'private'].includes(visibility)) {
      note.visibility = visibility;
    }

    if (tags !== undefined && Array.isArray(tags)) {
      note.tags = tags.map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : '')).filter(Boolean);
    }

    await note.save();

    return res.status(200).json({ note });
  } catch (error) {
    console.error('Update note error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Soft-delete a note
// @access  Private (Owner / Admin)
router.delete('/:id', protect, ownerOrAdmin(getNoteOwnerId), async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note || note.isDeleted) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.isDeleted = true;
    await note.save();

    return res.status(200).json({ message: 'Note deleted' });
  } catch (error) {
    console.error('Delete note error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notes/:id/renew
// @desc    Renew an expiring note (owner only)
// @access  Private (Owner only)
router.post('/:id/renew', protect, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, isDeleted: false });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.authorId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Only the owner can renew this note' });
    }

    if (note.isPermanent) {
      return res.status(400).json({ message: 'Permanent notes do not need renewal' });
    }

    const timeUntilExpiry = note.expiresAt ? new Date(note.expiresAt).getTime() - Date.now() : 0;

    if (timeUntilExpiry <= 0) {
      return res.status(410).json({ message: 'Note has expired' });
    }

    if (timeUntilExpiry > 2 * 60 * 60 * 1000) {
      return res.status(400).json({ message: 'Renewal not available yet' });
    }

    note.expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    note.renewedAt = new Date();

    await note.save();

    return res.status(200).json({ message: 'Note renewed', note });
  } catch (error) {
    console.error('Renew note error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
