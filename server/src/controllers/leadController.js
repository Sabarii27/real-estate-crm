const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { ROLES, LEAD_STAGES } = require('../utils/constants');

// Sales employees may only ever see/act on leads assigned to them.
// Admins see everything. This is enforced here (backend), not just hidden in the UI.
const scopeToUser = (req, filter = {}) => {
  if (req.user.role === ROLES.SALES) {
    return { ...filter, assignedTo: req.user._id };
  }
  return filter;
};

// @desc    List leads (search, filter by stage/assignee, pagination)
// @route   GET /api/leads
// @access  Private
const getLeads = asyncHandler(async (req, res) => {
  const { search, stage, assignedTo, page = 1, limit = 20 } = req.query;

  let filter = {};

  if (stage) filter.stage = stage;
  if (assignedTo) {
    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      throw new ApiError(400, 'Invalid assignedTo id');
    }
    filter.assignedTo = assignedTo;
  }

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  filter = scopeToUser(req, filter);

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Lead.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Leads fetched', leads, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
  });
});

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = asyncHandler(async (req, res) => {
  const filter = scopeToUser(req, { _id: req.params.id });
  const lead = await Lead.findOne(filter)
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email')
    .populate('notes.addedBy', 'name')
    .populate('activity.by', 'name');

  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  // Attach booking info if this lead has been booked (kept in sync with Unit/Booking on booking creation)
  const Booking = require('../models/Booking');
  const booking = await Booking.findOne({ lead: lead._id, status: 'Confirmed' })
    .populate({
      path: 'unit',
      select: 'unitNumber floor type price status',
    })
    .populate('project', 'name location')
    .populate('building', 'name')
    .populate('bookedBy', 'name');

  sendSuccess(res, 200, 'Lead fetched', { lead, booking: booking || null });
});

// @desc    Create lead
// @route   POST /api/leads
// @access  Private (Admin, Sales)
const createLead = asyncHandler(async (req, res) => {
  const { name, email, phone, source, assignedTo, followUpDate, note } = req.body;

  if (!name || !phone) {
    throw new ApiError(400, 'Name and phone are required');
  }

  // Sales employees can only create leads assigned to themselves.
  let finalAssignee = req.user.role === ROLES.ADMIN ? assignedTo || null : req.user._id;

  const lead = await Lead.create({
    name,
    email,
    phone,
    source,
    assignedTo: finalAssignee,
    followUpDate: followUpDate || null,
    createdBy: req.user._id,
    notes: note ? [{ text: note, addedBy: req.user._id }] : [],
    activity: [
      { type: 'created', message: `Lead created by ${req.user.name}`, by: req.user._id },
    ],
  });

  sendSuccess(res, 201, 'Lead created successfully', lead);
});

// @desc    Update lead (details, stage, assignment, follow-up)
// @route   PUT /api/leads/:id
// @access  Private (Admin, or Sales for their own leads)
const updateLead = asyncHandler(async (req, res) => {
  const filter = scopeToUser(req, { _id: req.params.id });
  const lead = await Lead.findOne(filter);

  if (!lead) {
    throw new ApiError(404, 'Lead not found or you do not have access to it');
  }

  const { name, email, phone, source, stage, assignedTo, followUpDate } = req.body;

  if (name !== undefined) lead.name = name;
  if (email !== undefined) lead.email = email;
  if (phone !== undefined) lead.phone = phone;
  if (source !== undefined) lead.source = source;
  if (followUpDate !== undefined) lead.followUpDate = followUpDate || null;

  // Only admins may reassign leads to another employee.
  if (assignedTo !== undefined) {
    if (req.user.role !== ROLES.ADMIN) {
      throw new ApiError(403, 'Only admins can reassign leads');
    }
    if (String(lead.assignedTo) !== String(assignedTo)) {
      lead.activity.push({
        type: 'assignment',
        message: `Lead reassigned by ${req.user.name}`,
        by: req.user._id,
      });
    }
    lead.assignedTo = assignedTo || null;
  }

  if (stage !== undefined && stage !== lead.stage) {
    if (!LEAD_STAGES.includes(stage)) {
      throw new ApiError(400, 'Invalid lead stage');
    }
    if (stage === 'Booked') {
      throw new ApiError(
        400,
        "Lead stage 'Booked' is set automatically when a booking is created, and cannot be set manually."
      );
    }
    lead.activity.push({
      type: 'stage_change',
      message: `Stage changed from "${lead.stage}" to "${stage}" by ${req.user.name}`,
      by: req.user._id,
    });
    lead.stage = stage;
  }

  await lead.save();
  sendSuccess(res, 200, 'Lead updated successfully', lead);
});

// @desc    Add a note to a lead
// @route   POST /api/leads/:id/notes
// @access  Private
const addNote = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    throw new ApiError(400, 'Note text is required');
  }

  const filter = scopeToUser(req, { _id: req.params.id });
  const lead = await Lead.findOne(filter);
  if (!lead) {
    throw new ApiError(404, 'Lead not found or you do not have access to it');
  }

  lead.notes.push({ text: text.trim(), addedBy: req.user._id });
  lead.activity.push({ type: 'note', message: `Note added by ${req.user.name}`, by: req.user._id });
  await lead.save();

  sendSuccess(res, 201, 'Note added', lead);
});

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private (Admin only)
const deleteLead = asyncHandler(async (req, res) => {
  const Booking = require('../models/Booking');
  const activeBooking = await Booking.findOne({ lead: req.params.id, status: 'Confirmed' });
  if (activeBooking) {
    throw new ApiError(409, 'Cannot delete a lead that has an active booking. Cancel the booking first.');
  }

  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  sendSuccess(res, 200, 'Lead deleted successfully');
});

module.exports = { getLeads, getLeadById, createLead, updateLead, addNote, deleteLead };
