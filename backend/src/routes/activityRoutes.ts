import { Router } from 'express';
import {
	getActivities,
	getActivityById,
	createActivity,
	createActivityValidation,
	updateActivity,
	updateActivityValidation,
} from '../controllers/activityController';
import { authenticate, requireAdministrator } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getActivities);
router.get('/:id', getActivityById);
router.post('/', createActivityValidation, createActivity);
router.put('/:id', requireAdministrator, updateActivityValidation, updateActivity);

export default router;
