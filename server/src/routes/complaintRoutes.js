import express from 'express';
import {
  checkDuplicates,
  createComplaint,
  getMyComplaints,
  getComplaintById,
  submitFeedback,
  reopenComplaint,
} from '../controllers/complaintController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { uploadImagesMiddleware } from '../middleware/uploadMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(protect);

router.post('/check-duplicates', authorizeRoles(ROLES.CITIZEN), checkDuplicates);
router.post(
  '/',
  authorizeRoles(ROLES.CITIZEN),
  uploadImagesMiddleware,
  createComplaint
);
router.get('/my', authorizeRoles(ROLES.CITIZEN), getMyComplaints);
router.get(
  '/:id',
  authorizeRoles(ROLES.CITIZEN, ROLES.OFFICIAL, ROLES.WORKER),
  getComplaintById
);
router.post('/:id/feedback', authorizeRoles(ROLES.CITIZEN), submitFeedback);
router.post('/:id/reopen', authorizeRoles(ROLES.CITIZEN), reopenComplaint);

export default router;
