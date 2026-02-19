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

export const getProjectTeamReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const month = parseInt(req.query['month'] as string, 10);
    const year = parseInt(req.query['year'] as string, 10);

    if (isNaN(projectId) || isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      res.status(400).json({ message: 'Invalid project, month or year' });
      return;
    }

    const result = await pool.query(
      `SELECT
         u.id,
         u.name,
         u.surnames,
         COALESCE(r.name, 'No role') AS role,
         COALESCE(SUM(a.hours), 0) AS total_hours
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN activities a
         ON a.user_id = u.id
         AND a.project_id = $1
         AND EXTRACT(MONTH FROM a.created_at) = $2
         AND EXTRACT(YEAR FROM a.created_at) = $3
       GROUP BY u.id, u.name, u.surnames, r.name
       ORDER BY u.name, u.surnames`,
      [projectId, month, year]
    );

    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch team report' });
  }
};
