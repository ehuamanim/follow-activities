import { Router } from 'express';
import { register, login, registerValidation, loginValidation } from '../controllers/authController';
import { authenticate, requireAdministrator } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', authenticate, requireAdministrator, registerValidation, register);
router.post('/login', loginValidation, login);

export default router;
