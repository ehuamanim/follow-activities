import { Router } from 'express';
import { getActivities, createActivity, createActivityValidation } from '../controllers/activityController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getActivities);
router.post('/', createActivityValidation, createActivity);

export default router;
