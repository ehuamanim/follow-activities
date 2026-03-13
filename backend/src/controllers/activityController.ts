import { Response } from 'express';
import { body } from 'express-validator';
import { pool } from '../config/database';
import { validate } from '../middleware/validationMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';

export const createActivityValidation = [
  body('project_id').isInt({ min: 1 }).withMessage('Valid project_id is required'),
  body('hours').isFloat({ min: 0.1 }).withMessage('Hours must be a positive number'),
  body('cost_per_hour').isFloat({ min: 0 }).withMessage('Cost per hour must be a valid non-negative number'),
  body('tasks').notEmpty().withMessage('Tasks description is required'),
  body('activity_date').optional().isDate().withMessage('activity_date must be a valid date (YYYY-MM-DD)'),
  validate,
];

export const updateActivityValidation = [
  body('project_id').optional().isInt({ min: 1 }).withMessage('Valid project_id is required'),
  body('hours').optional().isFloat({ min: 0.1 }).withMessage('Hours must be a positive number'),
  body('cost_per_hour').optional().isFloat({ min: 0 }).withMessage('Cost per hour must be a valid non-negative number'),
  body('tasks').optional().notEmpty().withMessage('Tasks description cannot be empty'),
  body('activity_date').optional().isDate().withMessage('activity_date must be a valid date (YYYY-MM-DD)'),
  validate,
];

export const getActivities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const currentProfile = req.user?.profile;
    const requestedUserId = req.query['user_id'] ? Number.parseInt(req.query['user_id'] as string, 10) : null;
    const startDate = typeof req.query['start_date'] === 'string' ? req.query['start_date'] : null;
    const endDate = typeof req.query['end_date'] === 'string' ? req.query['end_date'] : null;

    if (!currentUserId || !currentProfile) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const isOperator = currentProfile === 'Operator';
    const values: Array<number | string> = [];
    const filters = [`u.status = 'A'`];

    if (isOperator) {
      values.push(currentUserId);
      filters.push(`a.user_id = $${values.length}`);
    } else if (requestedUserId !== null && !Number.isNaN(requestedUserId)) {
      values.push(requestedUserId);
      filters.push(`a.user_id = $${values.length}`);
    }

    if (startDate) {
      values.push(startDate);
      filters.push(`a.activity_date >= $${values.length}`);
    }

    if (endDate) {
      values.push(endDate);
      filters.push(`a.activity_date <= $${values.length}`);
    }

    const result = await pool.query(
      `SELECT a.id, a.user_id, a.project_id, a.hours, a.cost_per_hour, a.tasks, a.activity_date, a.created_at,
              u.name AS user_name, u.email AS user_email, p.name AS project_name,
              STRING_AGG(DISTINCT r.name, ', ' ORDER BY r.name) AS role_names
       FROM activities a
       JOIN users u ON u.id = a.user_id
       JOIN projects p ON p.id = a.project_id
       LEFT JOIN user_roles ur ON ur.user_id = a.user_id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE ${filters.join(' AND ')}
       GROUP BY a.id, u.name, u.email, p.name
       ORDER BY a.activity_date DESC, p.name`,
      values
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

    const { project_id, hours, cost_per_hour, tasks, activity_date } = req.body;
    const date = activity_date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      'INSERT INTO activities (user_id, project_id, hours, cost_per_hour, tasks, activity_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, project_id, hours, cost_per_hour, tasks, date]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ message: 'Failed to create activity' });
  }
};

export const getActivityById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activityId = Number.parseInt(req.params.id, 10);
    const currentUserId = req.user?.id;
    const currentProfile = req.user?.profile;

    if (Number.isNaN(activityId)) {
      res.status(400).json({ message: 'Invalid activity id' });
      return;
    }

    if (!currentUserId || !currentProfile) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const isOperator = currentProfile === 'Operator';
    const params: Array<number> = [activityId];
    const ownerFilter = isOperator ? 'AND a.user_id = $2' : '';

    if (isOperator) {
      params.push(currentUserId);
    }

    const result = await pool.query(
      `SELECT a.id, a.user_id, a.project_id, a.hours, a.cost_per_hour, a.tasks, a.activity_date, a.created_at,
              u.name AS user_name, u.email AS user_email, p.name AS project_name,
              STRING_AGG(DISTINCT r.name, ', ' ORDER BY r.name) AS role_names
       FROM activities a
       JOIN users u ON u.id = a.user_id
       JOIN projects p ON p.id = a.project_id
       LEFT JOIN user_roles ur ON ur.user_id = a.user_id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE a.id = $1 ${ownerFilter} AND u.status = 'A'
       GROUP BY a.id, u.name, u.email, p.name`,
      params
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Activity not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ message: 'Failed to fetch activity' });
  }
};

export const updateActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activityId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(activityId)) {
      res.status(400).json({ message: 'Invalid activity id' });
      return;
    }

    const { project_id, hours, cost_per_hour, tasks, activity_date } = req.body;

    const updates: string[] = [];
    const values: Array<number | string> = [];

    if (project_id !== undefined) {
      updates.push(`project_id = $${updates.length + 1}`);
      values.push(Number(project_id));
    }
    if (hours !== undefined) {
      updates.push(`hours = $${updates.length + 1}`);
      values.push(Number(hours));
    }
    if (cost_per_hour !== undefined) {
      updates.push(`cost_per_hour = $${updates.length + 1}`);
      values.push(Number(cost_per_hour));
    }
    if (tasks !== undefined) {
      updates.push(`tasks = $${updates.length + 1}`);
      values.push(tasks);
    }
    if (activity_date !== undefined) {
      updates.push(`activity_date = $${updates.length + 1}`);
      values.push(activity_date);
    }

    if (updates.length === 0) {
      res.status(400).json({ message: 'No fields provided to update' });
      return;
    }

    values.push(activityId);

    const updateResult = await pool.query(
      `UPDATE activities
       SET ${updates.join(', ')}
       WHERE id = $${updates.length + 1}
       RETURNING *`,
      values
    );

    if (updateResult.rows.length === 0) {
      res.status(404).json({ message: 'Activity not found' });
      return;
    }

    const result = await pool.query(
      `SELECT a.id, a.user_id, a.project_id, a.hours, a.cost_per_hour, a.tasks, a.activity_date, a.created_at,
              u.name AS user_name, u.email AS user_email, p.name AS project_name,
              STRING_AGG(DISTINCT r.name, ', ' ORDER BY r.name) AS role_names
       FROM activities a
       JOIN users u ON u.id = a.user_id
       JOIN projects p ON p.id = a.project_id
       LEFT JOIN user_roles ur ON ur.user_id = a.user_id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE a.id = $1 AND u.status = 'A'
       GROUP BY a.id, u.name, u.email, p.name`,
      [activityId]
    );

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ message: 'Failed to update activity' });
  }
};

export const deleteActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activityId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(activityId)) {
      res.status(400).json({ message: 'Invalid activity id' });
      return;
    }

    const result = await pool.query('DELETE FROM activities WHERE id = $1 RETURNING id', [activityId]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Activity not found' });
      return;
    }

    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Failed to delete activity' });
  }
};
