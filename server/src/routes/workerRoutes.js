import express from 'express';
import {
  getWorkerDashboard,
  getWorkerTasks,
  getWorkerTaskById,
  acceptTask,
  updateTaskStatus,
  completeTask,
} from '../controllers/workerController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { uploadImagesMiddleware } from '../middleware/uploadMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(protect, authorizeRoles(ROLES.WORKER));

router.get('/dashboard', getWorkerDashboard);
router.get('/tasks', getWorkerTasks);
router.get('/tasks/:id', getWorkerTaskById);
router.patch('/tasks/:id/accept', acceptTask);
router.patch('/tasks/:id/status', updateTaskStatus);
router.post('/tasks/:id/complete', uploadImagesMiddleware, completeTask);

export default router;
