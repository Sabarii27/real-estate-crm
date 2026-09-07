const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('../utils/constants');

const bookingSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    // Denormalized snapshot fields so historical bookings still display
    // sensible data even if the unit/project/building is later edited.
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
    price: { type: Number, required: true },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.CONFIRMED,
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

// CRITICAL BUSINESS RULE ENFORCEMENT (defense in depth):
// A partial unique index ensures the database itself will never contain two
// "Confirmed" bookings for the same unit, even if application logic is bypassed.
// This complements (not replaces) the atomic findOneAndUpdate guard in the
// booking controller, which is the primary mechanism preventing double-booking.
bookingSchema.index(
  { unit: 1 },
  {
    unique: true,
    partialFilterExpression: { status: BOOKING_STATUS.CONFIRMED },
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
