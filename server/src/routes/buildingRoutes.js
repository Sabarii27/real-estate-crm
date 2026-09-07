const express = require('express');
const {
  getBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} = require('../controllers/buildingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validateObjectId = require('../middleware/validateObjectId');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(protect);

router.route('/').get(getBuildings).post(authorize(ROLES.ADMIN), createBuilding);

router
  .route('/:id')
  .get(validateObjectId(), getBuildingById)
  .put(validateObjectId(), authorize(ROLES.ADMIN), updateBuilding)
  .delete(validateObjectId(), authorize(ROLES.ADMIN), deleteBuilding);

module.exports = router;
