import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { getHoursByTeam, getHoursByProject, getHoursByRole } from '../services/dashboardService';

type Period = 'week' | 'month';

const parsePeriod = (raw: unknown): Period =>
  raw === 'month' ? 'month' : 'week';

export const hoursByTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const period = parsePeriod(req.query.period);
    const data = await getHoursByTeam(period);
    res.json({ period, data });
  } catch {
    res.status(500).json({ message: 'Failed to fetch hours by team' });
  }
};

export const hoursByProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const period = parsePeriod(req.query.period);
    const data = await getHoursByProject(period);
    res.json({ period, data });
  } catch {
    res.status(500).json({ message: 'Failed to fetch hours by project' });
  }
};

export const hoursByRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const period = parsePeriod(req.query.period);
    const data = await getHoursByRole(period);
    res.json({ period, data });
  } catch {
    res.status(500).json({ message: 'Failed to fetch hours by role' });
  }
};
