import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getRoles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT id, name, description FROM roles ORDER BY name');
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
};
