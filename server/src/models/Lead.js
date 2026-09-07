const mongoose = require('mongoose');
const { LEAD_STAGES, LEAD_SOURCES } = require('../utils/constants');

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// Lightweight embedded activity log so the lead detail page can show
// a history of stage changes / assignment changes without a separate collection.
const activitySchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g. 'stage_change', 'assignment', 'note', 'created'
    message: { type: String, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Lead name is required'], trim: true, maxlength: 100 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9+\-\s()]{7,20}$/, 'Please provide a valid phone number'],
    },
    source: {
      type: String,
      enum: LEAD_SOURCES,
      default: 'Other',
    },
    stage: {
      type: String,
      enum: LEAD_STAGES,
      default: 'New',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    notes: [noteSchema],
    activity: [activitySchema],
    followUpDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

leadSchema.index({ name: 'text', email: 'text', phone: 'text' });

module.exports = mongoose.model('Lead', leadSchema);
