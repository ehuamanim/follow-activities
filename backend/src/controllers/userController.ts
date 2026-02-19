import { Response } from 'express';
import { body } from 'express-validator';
import { pool } from '../config/database';
import { validate } from '../middleware/validationMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';
import { registerUser } from '../services/authService';

export const createUserValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').optional().isString(),
  body('surnames').optional().isString(),
  validate,
];

export const getUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, name, surnames, email, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT u.id, u.name, u.surnames, u.email, u.created_at,
              COALESCE(
                json_agg(json_build_object('id', r.id, 'name', r.name)) FILTER (WHERE r.id IS NOT NULL),
                '[]'
              ) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user } = await registerUser(req.body);
    res.status(201).json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create user';
    const status = message === 'Email already registered' ? 409 : 500;
    res.status(status).json({ message });
  }
};
