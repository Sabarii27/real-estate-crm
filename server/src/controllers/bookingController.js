const Booking = require('../models/Booking');
const Unit = require('../models/Unit');
const Lead = require('../models/Lead');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { UNIT_STATUS, BOOKING_STATUS, ROLES } = require('../utils/constants');

// @desc    List bookings
// @route   GET /api/bookings
const getBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  // Sales employees only see bookings they personally created.
  if (req.user.role === ROLES.SALES) {
    filter.bookedBy = req.user._id;
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('lead', 'name phone email')
      .populate('unit', 'unitNumber floor type price status')
      .populate('project', 'name location')
      .populate('building', 'name')
      .populate('bookedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Booking.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Bookings fetched', bookings, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
  });
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
const getBookingById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === ROLES.SALES) filter.bookedBy = req.user._id;

  const booking = await Booking.findOne(filter)
    .populate('lead')
    .populate('unit')
    .populate('project', 'name location')
    .populate('building', 'name')
    .populate('bookedBy', 'name email');

  if (!booking) throw new ApiError(404, 'Booking not found');
  sendSuccess(res, 200, 'Booking fetched', booking);
});

// @desc    Create a booking for a lead + unit
// @route   POST /api/bookings
// @access  Private (Admin, Sales)
//
// CRITICAL BUSINESS RULE: two users must never be able to successfully book the
// same unit. See README "Booking Concurrency" section for full explanation.
//
// Strategy: perform an atomic, conditional update on the Unit document
// (findOneAndUpdate with a filter that requires status === 'Available').
// MongoDB guarantees this find-and-modify operation is atomic at the document
// level, so even if two requests arrive at virtually the same instant, only
// one of them can successfully flip the unit from Available -> Booked.
// The loser's update simply matches zero documents and we return 409.
//
// As defense-in-depth, Booking also has a partial unique index on `unit`
// scoped to status: 'Confirmed' (see models/Booking.js), so even a bug
// elsewhere in the codebase could not result in two confirmed bookings
// for the same unit at the database level.
const createBooking = asyncHandler(async (req, res) => {
  const { leadId, unitId, notes } = req.body;

  if (!leadId || !unitId) {
    throw new ApiError(400, 'leadId and unitId are required');
  }

  const lead = await Lead.findOne(
    req.user.role === ROLES.SALES ? { _id: leadId, assignedTo: req.user._id } : { _id: leadId }
  );
  if (!lead) {
    throw new ApiError(404, 'Lead not found or you do not have access to it');
  }
  if (lead.stage === 'Lost') {
    throw new ApiError(400, 'Cannot book a unit for a lead marked as Lost');
  }

  // Step 1: atomically claim the unit. This is the operation that actually
  // prevents double-booking -- everything after this point only runs for
  // the single request that wins the race.
  const claimedUnit = await Unit.findOneAndUpdate(
    { _id: unitId, status: UNIT_STATUS.AVAILABLE },
    { $set: { status: UNIT_STATUS.BOOKED } },
    { new: true }
  );

  if (!claimedUnit) {
    // Either the unit doesn't exist, or (far more likely) someone else
    // booked it a moment ago. Distinguish the two for a clearer message.
    const exists = await Unit.findById(unitId);
    if (!exists) throw new ApiError(404, 'Unit not found');
    throw new ApiError(409, 'Unit is no longer available. Someone else may have just booked it.');
  }

  try {
    // Step 2: create the booking record now that we exclusively hold the unit.
    const booking = await Booking.create({
      lead: lead._id,
      unit: claimedUnit._id,
      project: claimedUnit.project,
      building: claimedUnit.building,
      price: claimedUnit.price,
      bookedBy: req.user._id,
      notes: notes || '',
      status: BOOKING_STATUS.CONFIRMED,
    });

    // Step 3: keep the lead in sync with the business rule "booking exists => lead is Booked".
    lead.stage = 'Booked';
    lead.activity.push({
      type: 'stage_change',
      message: `Lead booked into unit ${claimedUnit.unitNumber} by ${req.user.name}`,
      by: req.user._id,
    });
    await lead.save();

    const populated = await booking.populate([
      { path: 'lead', select: 'name phone email' },
      { path: 'unit', select: 'unitNumber floor type price status' },
      { path: 'project', select: 'name location' },
      { path: 'building', select: 'name' },
      { path: 'bookedBy', select: 'name email' },
    ]);

    sendSuccess(res, 201, 'Booking created successfully', populated);
  } catch (err) {
    // Roll back the unit claim if anything after it fails (e.g. the rare case
    // where the partial unique index rejects a duplicate confirmed booking).
    await Unit.findByIdAndUpdate(claimedUnit._id, { $set: { status: UNIT_STATUS.AVAILABLE } });

    if (err.code === 11000) {
      throw new ApiError(409, 'Unit is no longer available. Someone else may have just booked it.');
    }
    throw err;
  }
});

// @desc    Update booking (cancel it)
// @route   PUT /api/bookings/:id
// @access  Private (Admin, or Sales who created it)
const updateBooking = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  const filter = { _id: req.params.id };
  if (req.user.role === ROLES.SALES) filter.bookedBy = req.user._id;

  const booking = await Booking.findOne(filter);
  if (!booking) throw new ApiError(404, 'Booking not found');

  if (notes !== undefined) booking.notes = notes;

  if (status !== undefined && status !== booking.status) {
    if (!Object.values(BOOKING_STATUS).includes(status)) {
      throw new ApiError(400, 'Invalid booking status');
    }

    if (status === BOOKING_STATUS.CANCELLED && booking.status === BOOKING_STATUS.CONFIRMED) {
      // Cancelling a booking frees up the unit again.
      booking.status = BOOKING_STATUS.CANCELLED;
      await Unit.findByIdAndUpdate(booking.unit, { $set: { status: UNIT_STATUS.AVAILABLE } });

      const lead = await Lead.findById(booking.lead);
      if (lead) {
        lead.stage = 'Negotiation';
        lead.activity.push({
          type: 'stage_change',
          message: `Booking cancelled by ${req.user.name}; unit released`,
          by: req.user._id,
        });
        await lead.save();
      }
    } else {
      booking.status = status;
    }
  }

  await booking.save();
  sendSuccess(res, 200, 'Booking updated successfully', booking);
});

module.exports = { getBookings, getBookingById, createBooking, updateBooking };
