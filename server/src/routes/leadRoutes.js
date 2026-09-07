const express = require('express');
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  addNote,
  deleteLead,
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validateObjectId = require('../middleware/validateObjectId');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(protect);

router.route('/').get(getLeads).post(createLead);

router
  .route('/:id')
  .get(validateObjectId(), getLeadById)
  .put(validateObjectId(), updateLead)
  .delete(validateObjectId(), authorize(ROLES.ADMIN), deleteLead);

router.post('/:id/notes', validateObjectId(), addNote);

module.exports = router;
