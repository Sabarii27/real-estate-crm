const Unit = require('../models/Unit');
const Building = require('../models/Building');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { UNIT_STATUS } = require('../utils/constants');

// @desc    List units with filters (project, building, type, status)
// @route   GET /api/units
const getUnits = asyncHandler(async (req, res) => {
  const { project, building, type, status, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (project) filter.project = project;
  if (building) filter.building = building;
  if (type) filter.type = type;
  if (status) filter.status = status;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
  const skip = (pageNum - 1) * limitNum;

  const [units, total] = await Promise.all([
    Unit.find(filter)
      .populate('project', 'name location')
      .populate('building', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Unit.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Units fetched', units, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
  });
});

// @desc    Get single unit
// @route   GET /api/units/:id
const getUnitById = asyncHandler(async (req, res) => {
  const unit = await Unit.findById(req.params.id).populate('project', 'name location').populate('building', 'name');
  if (!unit) throw new ApiError(404, 'Unit not found');
  sendSuccess(res, 200, 'Unit fetched', unit);
});

// @desc    Create unit
// @route   POST /api/units
// @access  Admin
const createUnit = asyncHandler(async (req, res) => {
  const { project, building, unitNumber, floor, type, price } = req.body;

  if (!project || !building || !unitNumber || floor === undefined || !type || price === undefined) {
    throw new ApiError(400, 'project, building, unitNumber, floor, type and price are required');
  }
  if (Number(price) <= 0) {
    throw new ApiError(400, 'Price must be a positive number');
  }

  const buildingDoc = await Building.findById(building);
  if (!buildingDoc) throw new ApiError(404, 'Building not found');
  if (String(buildingDoc.project) !== String(project)) {
    throw new ApiError(400, 'Building does not belong to the given project');
  }

  const unit = await Unit.create({
    project,
    building,
    unitNumber: unitNumber.trim(),
    floor,
    type,
    price,
    status: UNIT_STATUS.AVAILABLE,
  });

  sendSuccess(res, 201, 'Unit created successfully', unit);
});

// @desc    Update unit
// @route   PUT /api/units/:id
// @access  Admin
const updateUnit = asyncHandler(async (req, res) => {
  const { unitNumber, floor, type, price, status } = req.body;
  const unit = await Unit.findById(req.params.id);
  if (!unit) throw new ApiError(404, 'Unit not found');

  // Prevent manually flipping a booked unit back to Available while an active
  // booking still references it -- that must go through booking cancellation.
  if (status !== undefined && status !== unit.status) {
    if (status === UNIT_STATUS.AVAILABLE) {
      const activeBooking = await Booking.findOne({ unit: unit._id, status: 'Confirmed' });
      if (activeBooking) {
        throw new ApiError(
          409,
          'Cannot mark this unit as Available while it has an active booking. Cancel the booking first.'
        );
      }
    }
    unit.status = status;
  }

  if (unitNumber !== undefined) unit.unitNumber = unitNumber.trim();
  if (floor !== undefined) unit.floor = floor;
  if (type !== undefined) unit.type = type;
  if (price !== undefined) {
    if (Number(price) <= 0) throw new ApiError(400, 'Price must be a positive number');
    unit.price = price;
  }

  await unit.save();
  sendSuccess(res, 200, 'Unit updated successfully', unit);
});

// @desc    Delete unit (only if not booked / no bookings reference it)
// @route   DELETE /api/units/:id
// @access  Admin
const deleteUnit = asyncHandler(async (req, res) => {
  const bookingCount = await Booking.countDocuments({ unit: req.params.id, status: 'Confirmed' });
  if (bookingCount > 0) {
    throw new ApiError(409, 'Cannot delete a unit that has an active booking.');
  }

  const unit = await Unit.findByIdAndDelete(req.params.id);
  if (!unit) throw new ApiError(404, 'Unit not found');

  sendSuccess(res, 200, 'Unit deleted successfully');
});

module.exports = { getUnits, getUnitById, createUnit, updateUnit, deleteUnit };
