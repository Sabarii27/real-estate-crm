const express = require('express');
const { getBookings, getBookingById, createBooking, updateBooking } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.use(protect);

router.route('/').get(getBookings).post(createBooking);

router.route('/:id').get(validateObjectId(), getBookingById).put(validateObjectId(), updateBooking);

module.exports = router;
