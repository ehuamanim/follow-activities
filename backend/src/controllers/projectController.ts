import { Response } from 'express';
import { body } from 'express-validator';
import { pool } from '../config/database';
import { validate } from '../middleware/validationMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';

export const createProjectValidation = [
  body('name').notEmpty().withMessage('Project name is required'),
  body('description').optional().isString(),
  body('status').optional().isIn(['active', 'inactive', 'completed']).withMessage('Invalid status'),
  body('budget_hours').optional().isFloat({ min: 0 }),
  body('budget_cost').optional().isFloat({ min: 0 }),
  validate,
];

export const updateProjectValidation = [
  body('name').optional().notEmpty().withMessage('Project name cannot be empty'),
  body('description').optional().isString(),
  body('status').optional().isIn(['active', 'inactive', 'completed']).withMessage('Invalid status'),
  body('budget_hours').optional().isFloat({ min: 0 }),
  body('budget_cost').optional().isFloat({ min: 0 }),
  validate,
];

const projectSelect = `
  SELECT p.*,
    COALESCE((SELECT SUM(a.hours) FROM activities a WHERE a.project_id = p.id), 0) AS actual_hours,
    COALESCE((
      SELECT SUM(a.hours * u.cost_per_hour)
      FROM activities a
      JOIN users u ON u.id = a.user_id
      WHERE a.project_id = p.id
    ), 0) AS actual_cost
  FROM projects p
`;

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const profile = req.user?.profile;
    if (!userId || !profile) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const includeArchived = req.query.include_archived === 'true';
    const statusFilter = includeArchived ? '' : `AND p.status = 'active'`;

    if (profile === 'Administrator') {
      const result = await pool.query(
        `${projectSelect} WHERE 1=1 ${statusFilter} ORDER BY p.created_at DESC`
      );
      res.json(result.rows);
      return;
    }

    const result = await pool.query(
      `${projectSelect}
       JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = $1 ${statusFilter}
       ORDER BY p.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

export const getProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(projectId)) {
      res.status(400).json({ message: 'Invalid project id' });
      return;
    }

    const result = await pool.query(`${projectSelect} WHERE p.id = $1`, [projectId]);
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
    const { name, description, status, budget_hours, budget_cost } = req.body;
    const result = await pool.query(
      `INSERT INTO projects (name, description, status, budget_hours, budget_cost)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description ?? null, status ?? 'active', budget_hours ?? 0, budget_cost ?? 0]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ message: 'Failed to create project' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(projectId)) {
      res.status(400).json({ message: 'Invalid project id' });
      return;
    }

    const { name, description, status, budget_hours, budget_cost } = req.body;
    const updates: string[] = [];
    const values: Array<string | number> = [];

    const add = (column: string, value: string | number) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    if (name !== undefined) add('name', name);
    if (description !== undefined) add('description', description);
    if (status !== undefined) add('status', status);
    if (budget_hours !== undefined) add('budget_hours', Number(budget_hours));
    if (budget_cost !== undefined) add('budget_cost', Number(budget_cost));

    if (updates.length === 0) {
      res.status(400).json({ message: 'No fields provided to update' });
      return;
    }

    values.push(projectId);
    const result = await pool.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ message: 'Failed to update project' });
  }
};

export const archiveProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(projectId)) {
      res.status(400).json({ message: 'Invalid project id' });
      return;
    }

    const result = await pool.query(
      `UPDATE projects SET status = 'inactive' WHERE id = $1 RETURNING *`,
      [projectId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ message: 'Failed to archive project' });
  }
};

export const getProjectMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(projectId)) {
      res.status(400).json({ message: 'Invalid project id' });
      return;
    }

    const result = await pool.query(
      `SELECT pm.project_id, pm.user_id, u.name, u.surnames, u.email
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1 AND u.status = 'A'
       ORDER BY u.surnames, u.name`,
      [projectId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch project members' });
  }
};

export const addProjectMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number.parseInt(req.params.id, 10);
    const userId = Number(req.body.user_id);
    if (Number.isNaN(projectId) || Number.isNaN(userId)) {
      res.status(400).json({ message: 'Invalid project or user id' });
      return;
    }

    await pool.query(
      `INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [projectId, userId]
    );

    const result = await pool.query(
      `SELECT pm.project_id, pm.user_id, u.name, u.surnames, u.email
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1 AND pm.user_id = $2`,
      [projectId, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ message: 'Failed to add project member' });
  }
};

export const removeProjectMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = Number.parseInt(req.params.id, 10);
    const userId = Number.parseInt(req.params.userId, 10);
    if (Number.isNaN(projectId) || Number.isNaN(userId)) {
      res.status(400).json({ message: 'Invalid project or user id' });
      return;
    }

    await pool.query(
      `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Failed to remove project member' });
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

    const params: number[] = [projectId];
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
                EXTRACT(MONTH FROM a.activity_date)::int AS month,
                EXTRACT(YEAR FROM a.activity_date)::int AS year,
                SUM(a.hours) AS total_hours
         FROM activities a
         WHERE a.project_id = $1 ${userFilter}
         GROUP BY a.user_id,
                  EXTRACT(MONTH FROM a.activity_date),
                  EXTRACT(YEAR FROM a.activity_date)
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
    const projectIdsRaw = typeof req.query['project_ids'] === 'string' ? req.query['project_ids'] : null;
    const projectId = req.query['project_id'] ? Number.parseInt(req.query['project_id'] as string, 10) : null;
    const startDate = typeof req.query['start_date'] === 'string' ? req.query['start_date'] : null;
    const endDate = typeof req.query['end_date'] === 'string' ? req.query['end_date'] : null;

    const params: Array<number | string> = [];
    const filters = [`u.status = 'A'`];

    if (projectIdsRaw) {
      const ids = projectIdsRaw
        .split(',')
        .map((id) => Number.parseInt(id.trim(), 10))
        .filter((id) => !Number.isNaN(id));
      if (ids.length > 0) {
        params.push(...ids);
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
        filters.push(`a.project_id IN (${placeholders})`);
      }
    } else if (projectId !== null) {
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
        SUM(a.hours * u.cost_per_hour) AS total_cost
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
         AND EXTRACT(MONTH FROM a.activity_date) = $2
         AND EXTRACT(YEAR FROM a.activity_date) = $3
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
