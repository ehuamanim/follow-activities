import { Response } from 'express';
import { body } from 'express-validator';
import { pool } from '../config/database';
import { validate } from '../middleware/validationMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';

export const createActivityValidation = [
  body('project_id').isInt({ min: 1 }).withMessage('Valid project_id is required'),
  body('hours').isFloat({ min: 0.1 }).withMessage('Hours must be a positive number'),
  body('tasks').notEmpty().withMessage('Tasks description is required'),
  validate,
];

export const getActivities = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name AS user_name, u.email AS user_email, p.name AS project_name
       FROM activities a
       JOIN users u ON u.id = a.user_id
       JOIN projects p ON p.id = a.project_id
       ORDER BY a.created_at DESC`
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
};

export const createActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { project_id, hours, tasks } = req.body;

    const result = await pool.query(
      'INSERT INTO activities (user_id, project_id, hours, tasks) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, project_id, hours, tasks]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ message: 'Failed to create activity' });
  }
};
