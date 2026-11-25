import { pool } from '../config/database';

export type Period = 'week' | 'month' | 'custom';

export interface DateRange {
  startDate?: string;
  endDate?: string;
  period?: Period;
}

const buildDateFilter = (alias: string, range: DateRange): { clause: string; values: string[] } => {
  if (range.startDate && range.endDate) {
    return {
      clause: `${alias}.activity_date >= $1::date AND ${alias}.activity_date <= $2::date`,
      values: [range.startDate, range.endDate],
    };
  }

  const period = range.period === 'month' ? 'month' : 'week';
  const interval = period === 'week' ? '7 days' : '30 days';
  return {
    clause: `${alias}.activity_date >= (CURRENT_DATE - $1::interval)`,
    values: [interval],
  };
};

export const getHoursByTeam = async (range: DateRange) => {
  const { clause, values } = buildDateFilter('a', range);
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
       AND ${clause}
     WHERE u.status = 'A'
     GROUP BY u.id, u.name, u.surnames, u.email
     ORDER BY total_hours DESC`,
    values
  );
  return result.rows;
};

export const getHoursByProject = async (range: DateRange) => {
  const { clause, values } = buildDateFilter('a', range);
  const result = await pool.query(
    `SELECT
       p.id AS project_id,
       p.name AS project_name,
       COALESCE(SUM(a.hours), 0) AS total_hours
     FROM projects p
     LEFT JOIN activities a
       ON a.project_id = p.id
       AND ${clause}
     GROUP BY p.id, p.name
     ORDER BY total_hours DESC`,
    values
  );
  return result.rows;
};

export const getHoursByRole = async (range: DateRange) => {
  const { clause, values } = buildDateFilter('a', range);
  const result = await pool.query(
    `SELECT
       r.id AS role_id,
       r.name AS role_name,
       COALESCE(SUM(a.hours), 0) AS total_hours
     FROM roles r
     LEFT JOIN user_roles ur ON ur.role_id = r.id
     LEFT JOIN activities a
       ON a.user_id = ur.user_id
       AND ${clause}
     GROUP BY r.id, r.name
     ORDER BY total_hours DESC`,
    values
  );
  return result.rows;
};
