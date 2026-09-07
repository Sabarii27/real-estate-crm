const User = require('../models/User');
const Lead = require('../models/Lead');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { ROLES } = require('../utils/constants');

// @desc    List all users (for assignment dropdowns / admin management)
// @route   GET /api/users
// @access  Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  sendSuccess(res, 200, 'Users fetched', users.map((u) => u.toSafeObject()));
});

// @desc    Create a user (admin creating sales employees, etc.)
// @route   POST /api/users
// @access  Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new ApiError(409, 'A user with this email already exists');

  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password,
    role: Object.values(ROLES).includes(role) ? role : ROLES.SALES,
  });

  sendSuccess(res, 201, 'User created successfully', user.toSafeObject());
});

// @desc    Update a user (name, role, active status, optional password reset)
// @route   PUT /api/users/:id
// @access  Admin
const updateUser = asyncHandler(async (req, res) => {
  const { name, role, isActive, password } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (name !== undefined) user.name = name;
  if (role !== undefined) {
    if (!Object.values(ROLES).includes(role)) throw new ApiError(400, 'Invalid role');
    user.role = role;
  }
  if (isActive !== undefined) user.isActive = isActive;
  if (password) user.password = password; // pre-save hook will hash it

  await user.save();
  sendSuccess(res, 200, 'User updated successfully', user.toSafeObject());
});

// @desc    Delete a user (only if they have no assigned leads)
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  const assignedLeadCount = await Lead.countDocuments({ assignedTo: req.params.id });
  if (assignedLeadCount > 0) {
    throw new ApiError(409, 'Cannot delete a user who still has leads assigned to them. Reassign those leads first.');
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  sendSuccess(res, 200, 'User deleted successfully');
});

module.exports = { getUsers, createUser, updateUser, deleteUser };
