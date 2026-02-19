import { Request, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';
import { registerUser, loginUser } from '../services/authService';

export const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').optional().isString(),
  body('surnames').optional().isString(),
  validate,
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, token } = await registerUser(req.body);
    res.status(201).json({ user, token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    const status = message === 'Email already registered' ? 409 : 500;
    res.status(status).json({ message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser(email, password);
    res.json({ user, token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    const status = message === 'Invalid credentials' ? 401 : 500;
    res.status(status).json({ message });
  }
};
