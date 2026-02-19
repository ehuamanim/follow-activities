import { Router } from 'express';
import { getProjects, createProject, createProjectValidation, getProjectTeamReport } from '../controllers/projectController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.post('/', createProjectValidation, createProject);
router.get('/:id/team-report', getProjectTeamReport);

export default router;
