import { Router } from 'express';
import {
  getActivities,
  getActivityById,
  createActivity,
  createActivityValidation,
  updateActivity,
  updateActivityValidation,
  deleteActivity,
  copyPreviousActivity,
  bulkCreateActivities,
  reminderStatus,
} from '../controllers/activityController';
import { authenticate, requireAdministrator } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/reminder-status', reminderStatus);
router.get('/copy-previous', copyPreviousActivity);
router.post('/bulk', bulkCreateActivities);
router.get('/', getActivities);
router.get('/:id', getActivityById);
router.post('/', createActivityValidation, createActivity);
router.put('/:id', requireAdministrator, updateActivityValidation, updateActivity);
router.delete('/:id', requireAdministrator, deleteActivity);

export default router;
