import { Router } from 'express';
import { getUsers, getUserById, createUser, createUserValidation } from '../controllers/userController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUserValidation, createUser);

export default router;
