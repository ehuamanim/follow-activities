import { Router } from 'express';
import { getProjects, createProject, createProjectValidation } from '../controllers/projectController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.post('/', createProjectValidation, createProject);

export default router;
