import { pool } from '../config/database';

type Period = 'week' | 'month';

// Returns a safe parameterized interval string accepted by PostgreSQL
const periodInterval = (period: Period): string =>
  period === 'week' ? '7 days' : '30 days';

export const getHoursByTeam = async (period: Period) => {
  const interval = periodInterval(period);
  const result = await pool.query(
    `SELECT
       u.id AS user_id,
       u.name,
       u.surnames,
       u.email,
       COALESCE(SUM(a.hours), 0) AS total_hours
     FROM users u
     LEFT JOIN activities a
       ON a.user_id = u.id
       AND a.created_at >= NOW() - $1::interval
     GROUP BY u.id, u.name, u.surnames, u.email
     ORDER BY total_hours DESC`,
    [interval]
  );
  return result.rows;
};

export const getHoursByProject = async (period: Period) => {
  const interval = periodInterval(period);
  const result = await pool.query(
    `SELECT
       p.id AS project_id,
       p.name AS project_name,
       COALESCE(SUM(a.hours), 0) AS total_hours
     FROM projects p
     LEFT JOIN activities a
       ON a.project_id = p.id
       AND a.created_at >= NOW() - $1::interval
     GROUP BY p.id, p.name
     ORDER BY total_hours DESC`,
    [interval]
  );
  return result.rows;
};

export const getHoursByRole = async (period: Period) => {
  const interval = periodInterval(period);
  const result = await pool.query(
    `SELECT
       r.id AS role_id,
       r.name AS role_name,
       COALESCE(SUM(a.hours), 0) AS total_hours
     FROM roles r
     LEFT JOIN user_roles ur ON ur.role_id = r.id
     LEFT JOIN activities a
       ON a.user_id = ur.user_id
       AND a.created_at >= NOW() - $1::interval
     GROUP BY r.id, r.name
     ORDER BY total_hours DESC`,
    [interval]
  );
  return result.rows;
};
