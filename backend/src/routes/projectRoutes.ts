import { Router } from 'express';
import {
  getProjects,
  createProject,
  createProjectValidation,
  updateProject,
  updateProjectValidation,
  archiveProject,
  getProjectTeamReport,
  getActivitiesReport,
  getProjectCostReport,
  getProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
} from '../controllers/projectController';
import { authenticate, requireAdministrator } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.get('/cost-report', requireAdministrator, getProjectCostReport);
router.post('/', requireAdministrator, createProjectValidation, createProject);
router.get('/:id', getProject);
router.put('/:id', requireAdministrator, updateProjectValidation, updateProject);
router.patch('/:id/archive', requireAdministrator, archiveProject);
router.get('/:id/members', requireAdministrator, getProjectMembers);
router.post('/:id/members', requireAdministrator, addProjectMember);
router.delete('/:id/members/:userId', requireAdministrator, removeProjectMember);
router.get('/:id/team-report', requireAdministrator, getProjectTeamReport);
router.get('/:id/activities-report', requireAdministrator, getActivitiesReport);

export default router;
