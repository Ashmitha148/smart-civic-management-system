import express from 'express';
import {
  getAdminDashboard,
  getAllComplaints,
  getAdminComplaintById,
  verifyComplaint,
  rejectComplaint,
  updateComplaintPriority,
  assignWorker,
  approveCompletion,
  rejectCompletion,
  getWorkers,
  createWorker,
  updateWorker,
  getWorkerDetails,
} from '../controllers/adminController.js';
import {
  getAdminAnalytics,
  getWorkerPerformance,
  getHeatmapData,
  escalateComplaint,
  runSlaCheck,
} from '../controllers/analyticsController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(protect, authorizeRoles(ROLES.OFFICIAL));

router.get('/dashboard', getAdminDashboard);
router.get('/analytics', getAdminAnalytics);
router.get('/analytics/workers', getWorkerPerformance);
router.get('/heatmap', getHeatmapData);
router.post('/sla/check', runSlaCheck);

router.get('/complaints', getAllComplaints);
router.get('/complaints/:id', getAdminComplaintById);
router.patch('/complaints/:id/verify', verifyComplaint);
router.patch('/complaints/:id/reject', rejectComplaint);
router.patch('/complaints/:id/priority', updateComplaintPriority);
router.patch('/complaints/:id/escalate', escalateComplaint);
router.patch('/complaints/:id/approve-completion', approveCompletion);
router.patch('/complaints/:id/reject-completion', rejectCompletion);

router.post('/assignments', assignWorker);

router.get('/workers', getWorkers);
router.post('/workers', createWorker);
router.get('/workers/:id', getWorkerDetails);
router.patch('/workers/:id', updateWorker);

export default router;
