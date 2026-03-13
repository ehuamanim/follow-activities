import { Router } from 'express';
import {
	getProjects,
	createProject,
	createProjectValidation,
	getProjectTeamReport,
	getActivitiesReport,
	getProjectCostReport,
	getProject,
} from '../controllers/projectController';
import { authenticate, requireAdministrator } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.get('/cost-report', requireAdministrator, getProjectCostReport);
router.post('/', requireAdministrator, createProjectValidation, createProject);
router.get('/:id', getProject);
router.get('/:id/team-report', requireAdministrator, getProjectTeamReport);
router.get('/:id/activities-report', requireAdministrator, getActivitiesReport);

export default router;
