const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  slug: {
    type: String,
  },
  nanoid: {
    type: String,
    required: true,
    unique: true,
  },
  body: {
    type: String,
    default: '',
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'private',
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  authorRole: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  isPermanent: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  renewedAt: {
    type: Date,
    default: null,
  },
});

// Pre-save hook
noteSchema.pre('save', function (next) {
  // 1. Update updatedAt
  this.updatedAt = Date.now();

  // 2. Auto-generate slug if empty/falsy
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // 3. Expiry and permanence logic for new documents
  if (this.isNew) {
    this.isPermanent = this.authorRole === 'admin' || this.authorRole === 'superadmin';
    const createdTime = this.createdAt ? this.createdAt.getTime() : Date.now();
    if (this.isPermanent) {
      this.expiresAt = null;
    } else {
      this.expiresAt = new Date(createdTime + 2 * 24 * 60 * 60 * 1000);
    }
  }

  // 4. Proceed to next if function
  if (typeof next === 'function') {
    next();
  }
});

// Compound index for public notes / graph queries
noteSchema.index({ visibility: 1, isPermanent: 1, isDeleted: 1 });

module.exports = mongoose.model('Note', noteSchema);
