import { Router } from 'express';
import {
	getUsers,
	getUserById,
	createUser,
	createUserValidation,
	updateUser,
	updateUserValidation,
	changeUserPassword,
	changePasswordValidation,
	deleteUser,
	updateUserRoles,
} from '../controllers/userController';
import { authenticate, requireAdministrator } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(requireAdministrator);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUserValidation, createUser);
router.put('/:id', updateUserValidation, updateUser);
router.post('/:id/roles', updateUserRoles);
router.put('/:id/password', changePasswordValidation, changeUserPassword);
router.delete('/:id', deleteUser);

export default router;
