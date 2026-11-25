import { Response } from 'express';
import ExcelJS from 'exceljs';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';

const parseProjectIds = (raw: unknown): number[] => {
  if (typeof raw !== 'string' || !raw.trim()) {
    return [];
  }
  return raw
    .split(',')
    .map((id) => Number.parseInt(id.trim(), 10))
    .filter((id) => !Number.isNaN(id));
};

export const exportActivitiesXlsx = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startDate = typeof req.query.start_date === 'string' ? req.query.start_date : null;
    const endDate = typeof req.query.end_date === 'string' ? req.query.end_date : null;
    const projectIds = parseProjectIds(req.query.project_ids);
    const userId = req.query.user_id ? Number.parseInt(String(req.query.user_id), 10) : null;

    const values: Array<number | string> = [];
    const filters = [`u.status = 'A'`];

    if (req.user?.profile === 'Operator') {
      values.push(req.user.id);
      filters.push(`a.user_id = $${values.length}`);
    } else if (userId !== null && !Number.isNaN(userId)) {
      values.push(userId);
      filters.push(`a.user_id = $${values.length}`);
    }

    if (projectIds.length > 0) {
      const start = values.length + 1;
      values.push(...projectIds);
      const placeholders = projectIds.map((_, i) => `$${start + i}`).join(', ');
      filters.push(`a.project_id IN (${placeholders})`);
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
      `SELECT a.activity_date, u.name AS user_name, u.surnames, p.name AS project_name,
              a.hours, a.tasks, u.cost_per_hour,
              STRING_AGG(DISTINCT r.name, ', ' ORDER BY r.name) AS role_names
       FROM activities a
       JOIN users u ON u.id = a.user_id
       JOIN projects p ON p.id = a.project_id
       LEFT JOIN user_roles ur ON ur.user_id = a.user_id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE ${filters.join(' AND ')}
       GROUP BY a.id, a.activity_date, u.name, u.surnames, p.name, a.hours, a.tasks, u.cost_per_hour
       ORDER BY a.activity_date DESC`,
      values
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Actividades');
    sheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Usuario', key: 'usuario', width: 28 },
      { header: 'Proyecto', key: 'proyecto', width: 28 },
      { header: 'Rol', key: 'rol', width: 20 },
      { header: 'Horas', key: 'horas', width: 10 },
      { header: 'Costo/hora', key: 'costo', width: 12 },
      { header: 'Costo total', key: 'total', width: 12 },
      { header: 'Tareas', key: 'tareas', width: 50 },
    ];

    for (const row of result.rows) {
      const hours = Number(row.hours);
      const cost = Number(row.cost_per_hour);
      sheet.addRow({
        fecha: row.activity_date,
        usuario: `${row.surnames}, ${row.user_name}`,
        proyecto: row.project_name,
        rol: row.role_names || 'Sin rol',
        horas: hours,
        costo: cost,
        total: hours * cost,
        tareas: row.tasks,
      });
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="actividades.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch {
    res.status(500).json({ message: 'Failed to export activities' });
  }
};

export const exportCostReportXlsx = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startDate = typeof req.query.start_date === 'string' ? req.query.start_date : null;
    const endDate = typeof req.query.end_date === 'string' ? req.query.end_date : null;
    const projectIds = parseProjectIds(req.query.project_ids);

    const values: Array<number | string> = [];
    const filters = [`u.status = 'A'`];

    if (projectIds.length > 0) {
      const start = values.length + 1;
      values.push(...projectIds);
      const placeholders = projectIds.map((_, i) => `$${start + i}`).join(', ');
      filters.push(`a.project_id IN (${placeholders})`);
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
      `SELECT p.name AS project_name, u.name, u.surnames,
              SUM(a.hours) AS total_hours,
              SUM(a.hours * u.cost_per_hour) AS total_cost
       FROM activities a
       JOIN users u ON u.id = a.user_id
       JOIN projects p ON p.id = a.project_id
       WHERE ${filters.join(' AND ')}
       GROUP BY p.name, u.name, u.surnames
       ORDER BY p.name, u.surnames`,
      values
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Costos');
    sheet.columns = [
      { header: 'Proyecto', key: 'proyecto', width: 28 },
      { header: 'Usuario', key: 'usuario', width: 28 },
      { header: 'Horas', key: 'horas', width: 10 },
      { header: 'Costo total', key: 'total', width: 14 },
    ];

    for (const row of result.rows) {
      sheet.addRow({
        proyecto: row.project_name,
        usuario: `${row.surnames}, ${row.name}`,
        horas: Number(row.total_hours),
        total: Number(row.total_cost),
      });
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="costos-proyecto.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch {
    res.status(500).json({ message: 'Failed to export cost report' });
  }
};
