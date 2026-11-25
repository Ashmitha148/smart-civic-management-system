import express from 'express';
import { getCitizenDashboard } from '../controllers/dashboardController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.get('/citizen', protect, authorizeRoles(ROLES.CITIZEN), getCitizenDashboard);

// Phase 2 endpoints will be mounted here:
// router.get('/official', protect, authorizeRoles(ROLES.OFFICIAL), getOfficialDashboard);
// router.get('/worker', protect, authorizeRoles(ROLES.WORKER), getWorkerDashboard);

export default router;
