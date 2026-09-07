const express = require('express');
const { getUnits, getUnitById, createUnit, updateUnit, deleteUnit } = require('../controllers/unitController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validateObjectId = require('../middleware/validateObjectId');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(protect);

router.route('/').get(getUnits).post(authorize(ROLES.ADMIN), createUnit);

router
  .route('/:id')
  .get(validateObjectId(), getUnitById)
  .put(validateObjectId(), authorize(ROLES.ADMIN), updateUnit)
  .delete(validateObjectId(), authorize(ROLES.ADMIN), deleteUnit);

module.exports = router;
