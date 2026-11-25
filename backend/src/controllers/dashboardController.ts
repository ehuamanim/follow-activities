import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { DateRange, getHoursByTeam, getHoursByProject, getHoursByRole } from '../services/dashboardService';

const parseRange = (query: AuthRequest['query']): DateRange => {
  const startDate = typeof query.start_date === 'string' ? query.start_date : undefined;
  const endDate = typeof query.end_date === 'string' ? query.end_date : undefined;
  if (startDate && endDate) {
    return { startDate, endDate, period: 'custom' };
  }
  return { period: query.period === 'month' ? 'month' : 'week' };
};

export const hoursByTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getHoursByTeam(parseRange(req.query));
    res.json(
      data.map((d) => ({
        id: d.user_id,
        label: `${d.surnames}, ${d.name}`,
        hours: Number(d.total_hours),
        key: 'user',
      }))
    );
  } catch {
    res.status(500).json({ message: 'Failed to fetch hours by team' });
  }
};

export const hoursByProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getHoursByProject(parseRange(req.query));
    res.json(
      data.map((d) => ({
        id: d.project_id,
        label: d.project_name,
        hours: Number(d.total_hours),
        key: 'project',
      }))
    );
  } catch {
    res.status(500).json({ message: 'Failed to fetch hours by project' });
  }
};

export const hoursByRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getHoursByRole(parseRange(req.query));
    res.json(
      data.map((d) => ({
        id: d.role_id,
        label: d.role_name,
        hours: Number(d.total_hours),
        key: 'role',
      }))
    );
  } catch {
    res.status(500).json({ message: 'Failed to fetch hours by role' });
  }
};

export const comparePeriods = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const aStart = typeof req.query.a_start === 'string' ? req.query.a_start : null;
    const aEnd = typeof req.query.a_end === 'string' ? req.query.a_end : null;
    const bStart = typeof req.query.b_start === 'string' ? req.query.b_start : null;
    const bEnd = typeof req.query.b_end === 'string' ? req.query.b_end : null;

    if (!aStart || !aEnd || !bStart || !bEnd) {
      res.status(400).json({ message: 'a_start, a_end, b_start y b_end son requeridos' });
      return;
    }

    const [periodA, periodB] = await Promise.all([
      getHoursByProject({ startDate: aStart, endDate: aEnd, period: 'custom' }),
      getHoursByProject({ startDate: bStart, endDate: bEnd, period: 'custom' }),
    ]);

    const mapB = new Map(periodB.map((row) => [row.project_id, Number(row.total_hours)]));
    const rows = periodA.map((row) => {
      const hoursA = Number(row.total_hours);
      const hoursB = mapB.get(row.project_id) ?? 0;
      mapB.delete(row.project_id);
      return {
        project_id: row.project_id,
        project_name: row.project_name,
        hours_a: hoursA,
        hours_b: hoursB,
        delta: hoursA - hoursB,
      };
    });

    for (const [projectId, hoursB] of mapB.entries()) {
      const name = periodB.find((r) => r.project_id === projectId)?.project_name ?? '';
      rows.push({
        project_id: projectId,
        project_name: name,
        hours_a: 0,
        hours_b: hoursB,
        delta: -hoursB,
      });
    }

    res.json(rows.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta)));
  } catch {
    res.status(500).json({ message: 'Failed to compare periods' });
  }
};
