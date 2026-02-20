import { Router } from 'express';
import { getProjects, createProject, createProjectValidation, getProjectTeamReport, getActivitiesReport } from '../controllers/projectController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.post('/', createProjectValidation, createProject);
router.get('/:id/team-report', getProjectTeamReport);
router.get('/:id/activities-report', getActivitiesReport);

export default router;
