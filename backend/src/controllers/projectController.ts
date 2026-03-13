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

export const getProject = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = _req.params.id;
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ message: 'Failed to fetch project' });
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

export const getActivitiesReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number.parseInt(req.params.id, 10);
    const userId = req.query['user_id'] ? Number.parseInt(req.query['user_id'] as string, 10) : null;

    if (Number.isNaN(projectId)) {
      res.status(400).json({ message: 'Invalid project id' });
      return;
    }

    const params: (number)[] = [projectId];
    let userFilter = '';

    if (userId !== null && !Number.isNaN(userId)) {
      params.push(userId);
      userFilter = `AND a.user_id = $2`;
    }

    const result = await pool.query(
      `WITH role_agg AS (
         SELECT ur.user_id,
                COALESCE(STRING_AGG(r.name, ', ' ORDER BY r.name), 'No role') AS role
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         GROUP BY ur.user_id
       ),
       hours_by_month AS (
         SELECT a.user_id,
                EXTRACT(MONTH FROM a.created_at)::int AS month,
                EXTRACT(YEAR FROM a.created_at)::int AS year,
                SUM(a.hours) AS total_hours
         FROM activities a
         WHERE a.project_id = $1 ${userFilter}
         GROUP BY a.user_id,
                  EXTRACT(MONTH FROM a.created_at),
                  EXTRACT(YEAR FROM a.created_at)
       )
       SELECT p.name AS project_name,
              u.id AS user_id,
              u.name,
              u.surnames,
              COALESCE(ra.role, 'No role') AS role,
              hm.month,
              hm.year,
              hm.total_hours
       FROM hours_by_month hm
       JOIN users u ON u.id = hm.user_id
       JOIN projects p ON p.id = $1
       LEFT JOIN role_agg ra ON ra.user_id = u.id
      WHERE u.status = 'A'
       ORDER BY hm.year, hm.month, u.surnames, u.name`,
      params
    );

    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch activities report' });
  }
};

export const getProjectCostReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.query['project_id'] ? Number.parseInt(req.query['project_id'] as string, 10) : null;
    const startDate = typeof req.query['start_date'] === 'string' ? req.query['start_date'] : null;
    const endDate = typeof req.query['end_date'] === 'string' ? req.query['end_date'] : null;

    const params: Array<number | string> = [];
    const filters = [`u.status = 'A'`];

    if (projectId !== null) {
      if (Number.isNaN(projectId)) {
        res.status(400).json({ message: 'Invalid project id' });
        return;
      }

      params.push(projectId);
      filters.push(`a.project_id = $${params.length}`);
    }

    if (startDate) {
      params.push(startDate);
      filters.push(`a.activity_date >= $${params.length}`);
    }

    if (endDate) {
      params.push(endDate);
      filters.push(`a.activity_date <= $${params.length}`);
    }

    const result = await pool.query(
      `WITH role_agg AS (
         SELECT ur.user_id,
                COALESCE(STRING_AGG(r.name, ', ' ORDER BY r.name), 'No role') AS role
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         GROUP BY ur.user_id
       )
       SELECT p.id AS project_id,
              p.name AS project_name,
              u.id AS user_id,
              u.name,
              u.surnames,
              COALESCE(ra.role, 'No role') AS role,
              SUM(a.hours) AS total_hours,
              SUM(a.hours * a.cost_per_hour) AS total_cost
       FROM activities a
       JOIN users u ON u.id = a.user_id
       JOIN projects p ON p.id = a.project_id
       LEFT JOIN role_agg ra ON ra.user_id = u.id
       WHERE ${filters.join(' AND ')}
       GROUP BY p.id, p.name, u.id, u.name, u.surnames, ra.role
       ORDER BY p.name, u.surnames, u.name`,
      params
    );

    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch cost report' });
  }
};

export const getProjectTeamReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number.parseInt(req.params.id, 10);
    const month = Number.parseInt(req.query['month'] as string, 10);
    const year = Number.parseInt(req.query['year'] as string, 10);

    if (Number.isNaN(projectId) || Number.isNaN(month) || Number.isNaN(year) || month < 1 || month > 12) {
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
       WHERE u.status = 'A'
       GROUP BY u.id, u.name, u.surnames, r.name
       ORDER BY u.name, u.surnames`,
      [projectId, month, year]
    );

    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch team report' });
  }
};
