const express = require('express');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validateObjectId = require('../middleware/validateObjectId');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(protect);

router.route('/').get(getProjects).post(authorize(ROLES.ADMIN), createProject);

router
  .route('/:id')
  .get(validateObjectId(), getProjectById)
  .put(validateObjectId(), authorize(ROLES.ADMIN), updateProject)
  .delete(validateObjectId(), authorize(ROLES.ADMIN), deleteProject);

module.exports = router;
