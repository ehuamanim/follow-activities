import { Router } from 'express';
import { exportActivitiesXlsx, exportCostReportXlsx } from '../controllers/exportController';
import { authenticate, requireAdministrator } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.get('/activities.xlsx', exportActivitiesXlsx);
router.get('/costs.xlsx', requireAdministrator, exportCostReportXlsx);

export default router;
