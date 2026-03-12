import { Router } from 'express';
import { hoursByTeam, hoursByProject, hoursByRole } from '../controllers/dashboardController';
import { authenticate, requireAdministrator } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(requireAdministrator);

router.get('/hours-by-team', hoursByTeam);
router.get('/hours-by-project', hoursByProject);
router.get('/hours-by-role', hoursByRole);

export default router;
