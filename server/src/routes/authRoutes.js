const express = require('express');
const { login, register, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);

// Public signup creates a sales account. Admins create elevated accounts
// through the protected /api/users endpoint.
router.post('/register', register);

router.get('/me', protect, getMe);

module.exports = router;
