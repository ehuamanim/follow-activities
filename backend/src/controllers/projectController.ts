import { Response } from 'express';
import { body } from 'express-validator';
import { pool } from '../config/database';
import { validate } from '../middleware/validationMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';

export const createProjectValidation = [
  body('name').notEmpty().withMessage('Project name is required'),
  body('description').optional().isString(),
  body('status').optional().isIn(['active', 'inactive', 'completed']).withMessage('Invalid status'),
  validate,
];

export const getProjects = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO projects (name, description, status) VALUES ($1, $2, $3) RETURNING *',
      [name, description ?? null, status ?? 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ message: 'Failed to create project' });
  }
};
