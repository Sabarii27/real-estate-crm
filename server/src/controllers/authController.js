const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const generateToken = require('../utils/generateToken');
const { ROLES } = require('../utils/constants');

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user);

  sendSuccess(res, 200, 'Login successful', {
    token,
    user: user.toSafeObject(),
  });
});

// @desc    Register a new sales user from the public signup page
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password,
    role: ROLES.SALES,
  });

  const token = generateToken(user);

  sendSuccess(res, 201, 'User registered successfully', {
    token,
    user: user.toSafeObject(),
  });
});

// @desc    Get currently logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Current user fetched', { user: req.user.toSafeObject() });
});

module.exports = { login, register, getMe };
