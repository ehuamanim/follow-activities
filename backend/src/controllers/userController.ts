import { Response } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { validate } from '../middleware/validationMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';
import { registerUser } from '../services/authService';

const SALT_ROUNDS = 12;

const addUserUpdateField = (
  updates: string[],
  values: Array<string | number>,
  fieldName: string,
  value: string | number | undefined
): void => {
  if (value === undefined) {
    return;
  }

  updates.push(`${fieldName} = $${updates.length + 1}`);
  values.push(value);
};

export const createUserValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('profile').isIn(['Operator', 'Administrator']).withMessage('Profile must be Operator or Administrator'),
  body('cost_per_hour').optional().isFloat({ min: 0 }).withMessage('Cost per hour must be a valid non-negative number'),
  body('role_ids').optional().isArray().withMessage('role_ids must be an array'),
  body('role_ids.*').optional().isInt({ min: 1 }).withMessage('Each role id must be a valid integer'),
  body('name').optional().isString(),
  body('surnames').optional().isString(),
  validate,
];

export const updateUserValidation = [
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('profile').optional().isIn(['Operator', 'Administrator']).withMessage('Profile must be Operator or Administrator'),
  body('cost_per_hour').optional().isFloat({ min: 0 }).withMessage('Cost per hour must be a valid non-negative number'),
  body('role_ids').optional().isArray().withMessage('role_ids must be an array'),
  body('role_ids.*').optional().isInt({ min: 1 }).withMessage('Each role id must be a valid integer'),
  body('name').optional().isString(),
  body('surnames').optional().isString(),
  validate,
];

export const changePasswordValidation = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];

export const getUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      "SELECT id, name, surnames, email, profile, cost_per_hour, status, created_at FROM users WHERE status = 'A' ORDER BY created_at DESC"
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
      `SELECT u.id, u.name, u.surnames, u.email, u.profile, u.cost_per_hour, u.created_at,
              COALESCE(
                json_agg(json_build_object('id', r.id, 'name', r.name)) FILTER (WHERE r.id IS NOT NULL),
                '[]'
              ) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = $1 AND u.status = 'A'
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
    const { role_ids } = req.body;

    // Assign roles if provided
    if (role_ids && Array.isArray(role_ids) && role_ids.length > 0) {
      try {
        for (const roleId of role_ids) {
          await pool.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [user.id, roleId]
          );
        }
      } catch (roleError) {
        console.error('Error assigning roles:', roleError);
        // Don't fail the entire request, continue with user created but roles not assigned
      }
    }

    res.status(201).json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create user';
    const status = message === 'Email already registered' ? 409 : 500;
    res.status(status).json({ message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user id' });
      return;
    }

    const { name, surnames, email, profile, cost_per_hour, role_ids } = req.body;
    const normalizedCostPerHour = cost_per_hour === undefined ? undefined : Number(cost_per_hour);

    const updates: string[] = [];
    const values: Array<string | number> = [];

    addUserUpdateField(updates, values, 'name', name);
    addUserUpdateField(updates, values, 'surnames', surnames);
    addUserUpdateField(updates, values, 'email', email);
    addUserUpdateField(updates, values, 'profile', profile);
    addUserUpdateField(updates, values, 'cost_per_hour', normalizedCostPerHour);

    if (updates.length > 0) {
      values.push(userId.toString());
      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${updates.length + 1} AND status = 'A'`,
        values
      );
    }

    if (Array.isArray(role_ids)) {
      await pool.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
      for (const roleId of role_ids) {
        await pool.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, roleId]
        );
      }
    }

    const result = await pool.query(
      `SELECT u.id, u.name, u.surnames, u.email, u.profile, u.cost_per_hour, u.created_at,
              COALESCE(
                json_agg(json_build_object('id', r.id, 'name', r.name)) FILTER (WHERE r.id IS NOT NULL),
                '[]'
              ) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = $1 AND u.status = 'A'
       GROUP BY u.id`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update user';
    const status = message.includes('duplicate key') ? 409 : 500;
    res.status(status).json({ message });
  }
};

export const updateUserRoles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    const { role_ids } = req.body;

    if (Number.isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user id' });
      return;
    }

    if (!Array.isArray(role_ids)) {
      res.status(400).json({ message: 'role_ids must be an array' });
      return;
    }

    await pool.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
    for (const roleId of role_ids) {
      await pool.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, roleId]
      );
    }

    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Failed to update user roles' });
  }
};

export const changeUserPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user id' });
      return;
    }

    const { password } = req.body;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2 AND status = 'A' RETURNING id", [passwordHash, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Failed to change password' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user id' });
      return;
    }

    const result = await pool.query("UPDATE users SET status = 'I' WHERE id = $1 AND status = 'A' RETURNING id", [userId]);
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Failed to delete user' });
  }
};
