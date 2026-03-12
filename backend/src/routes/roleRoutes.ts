import { Router } from 'express';
import { getRoles } from '../controllers/roleController';
import { authenticate, requireAdministrator } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, requireAdministrator, getRoles);

export default router;
