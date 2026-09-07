const express = require('express');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validateObjectId = require('../middleware/validateObjectId');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN));

router.route('/').get(getUsers).post(createUser);
router.route('/:id').put(validateObjectId(), updateUser).delete(validateObjectId(), deleteUser);

module.exports = router;
