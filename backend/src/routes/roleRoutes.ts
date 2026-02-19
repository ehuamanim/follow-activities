import { Router } from 'express';
import { getRoles } from '../controllers/roleController';

const router = Router();

router.get('/', getRoles);

export default router;
