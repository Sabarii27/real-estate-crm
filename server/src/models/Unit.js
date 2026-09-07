const mongoose = require('mongoose');
const { UNIT_STATUS, UNIT_TYPES } = require('../utils/constants');

const unitSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building',
      required: true,
      index: true,
    },
    unitNumber: {
      type: String,
      required: [true, 'Unit number is required'],
      trim: true,
      maxlength: 30,
    },
    floor: {
      type: Number,
      required: [true, 'Floor is required'],
      min: 0,
    },
    type: {
      type: String,
      enum: UNIT_TYPES,
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be a positive number'],
    },
    status: {
      type: String,
      enum: Object.values(UNIT_STATUS),
      default: UNIT_STATUS.AVAILABLE,
      index: true,
    },
  },
  { timestamps: true }
);

// A unit number must be unique within a building.
unitSchema.index({ building: 1, unitNumber: 1 }, { unique: true });

module.exports = mongoose.model('Unit', unitSchema);
