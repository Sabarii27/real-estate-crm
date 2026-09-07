const Lead = require('../models/Lead');
const Unit = require('../models/Unit');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { ROLES, LEAD_STAGES, UNIT_STATUS, BOOKING_STATUS } = require('../utils/constants');

// @desc    Aggregate stats for the dashboard
// @route   GET /api/dashboard/stats
// @access  Private (scoped: sales sees only their own leads/bookings)
const getStats = asyncHandler(async (req, res) => {
  const isSales = req.user.role === ROLES.SALES;
  const leadFilter = isSales ? { assignedTo: req.user._id } : {};
  const bookingFilter = isSales ? { bookedBy: req.user._id, status: BOOKING_STATUS.CONFIRMED } : { status: BOOKING_STATUS.CONFIRMED };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [
    totalLeads,
    newLeads,
    leadsByStageRaw,
    todaysFollowUps,
    upcomingFollowUps,
    totalBookings,
    recentBookings,
    availableUnits,
    bookedUnits,
    bookingsOverTimeRaw,
  ] = await Promise.all([
    Lead.countDocuments(leadFilter),
    Lead.countDocuments({ ...leadFilter, stage: 'New' }),
    Lead.aggregate([
      { $match: leadFilter },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]),
    Lead.find({ ...leadFilter, followUpDate: { $gte: startOfToday, $lte: endOfToday } })
      .populate('assignedTo', 'name')
      .sort({ followUpDate: 1 })
      .limit(10),
    Lead.find({ ...leadFilter, followUpDate: { $gt: endOfToday } })
      .populate('assignedTo', 'name')
      .sort({ followUpDate: 1 })
      .limit(10),
    Booking.countDocuments(bookingFilter),
    Booking.find(bookingFilter)
      .populate('lead', 'name phone')
      .populate('unit', 'unitNumber type price')
      .populate('project', 'name')
      .populate('bookedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5),
    // Unit availability is a global property/inventory metric (not scoped per employee).
    Unit.countDocuments({ status: UNIT_STATUS.AVAILABLE }),
    Unit.countDocuments({ status: UNIT_STATUS.BOOKED }),
    Booking.aggregate([
      { $match: bookingFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]),
  ]);

  // Ensure every stage appears in the response even with a zero count, so the chart is stable.
  const stageMap = Object.fromEntries(leadsByStageRaw.map((s) => [s._id, s.count]));
  const leadsByStage = LEAD_STAGES.map((stage) => ({ stage, count: stageMap[stage] || 0 }));

  sendSuccess(res, 200, 'Dashboard stats fetched', {
    totalLeads,
    newLeads,
    leadsByStage,
    todaysFollowUps,
    upcomingFollowUps,
    totalBookings,
    recentBookings,
    availableUnits,
    bookedUnits,
    bookingsOverTime: bookingsOverTimeRaw.map((b) => ({ date: b._id, count: b.count })),
  });
});

module.exports = { getStats };
