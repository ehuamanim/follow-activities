import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';

const uploadsRoot = path.resolve(process.cwd(), process.env.UPLOADS_DIR || 'uploads');

const ensureUploadsDir = () => {
  if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
  }
};

const canAccessActivity = async (
  activityId: number,
  userId: number,
  profile: string
): Promise<boolean> => {
  const result = await pool.query(`SELECT user_id FROM activities WHERE id = $1`, [activityId]);
  if (result.rows.length === 0) {
    return false;
  }
  if (profile === 'Administrator') {
    return true;
  }
  return Number(result.rows[0].user_id) === userId;
};

export const listComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activityId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(activityId) || !req.user) {
      res.status(400).json({ message: 'Invalid activity id' });
      return;
    }
    if (!(await canAccessActivity(activityId, req.user.id, req.user.profile))) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const result = await pool.query(
      `SELECT c.*, u.name AS user_name, u.surnames AS user_surnames
       FROM activity_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.activity_id = $1
       ORDER BY c.created_at ASC`,
      [activityId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Failed to list comments' });
  }
};

export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activityId = Number.parseInt(req.params.id, 10);
    const body = String(req.body?.body || '').trim();
    if (Number.isNaN(activityId) || !req.user || !body) {
      res.status(400).json({ message: 'body is required' });
      return;
    }
    if (!(await canAccessActivity(activityId, req.user.id, req.user.profile))) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const insert = await pool.query(
      `INSERT INTO activity_comments (activity_id, user_id, body)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [activityId, req.user.id, body]
    );

    const owner = await pool.query(`SELECT user_id FROM activities WHERE id = $1`, [activityId]);
    const ownerId = Number(owner.rows[0]?.user_id);
    if (ownerId && ownerId !== req.user.id) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, link)
         VALUES ($1, 'comment', $2, $3, $4)`,
        [
          ownerId,
          'Nuevo comentario en tu actividad',
          body.slice(0, 200),
          `/activities/${activityId}/edit`,
        ]
      );
    }

    res.status(201).json(insert.rows[0]);
  } catch {
    res.status(500).json({ message: 'Failed to create comment' });
  }
};

export const listAttachments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activityId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(activityId) || !req.user) {
      res.status(400).json({ message: 'Invalid activity id' });
      return;
    }
    if (!(await canAccessActivity(activityId, req.user.id, req.user.profile))) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const result = await pool.query(
      `SELECT id, activity_id, user_id, original_name, mime_type, size_bytes, created_at
       FROM activity_attachments
       WHERE activity_id = $1
       ORDER BY created_at DESC`,
      [activityId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Failed to list attachments' });
  }
};

export const uploadAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activityId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(activityId) || !req.user) {
      res.status(400).json({ message: 'Invalid activity id' });
      return;
    }
    if (!(await canAccessActivity(activityId, req.user.id, req.user.profile))) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: 'file is required' });
      return;
    }

    ensureUploadsDir();
    const result = await pool.query(
      `INSERT INTO activity_attachments
         (activity_id, user_id, original_name, stored_name, mime_type, size_bytes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, activity_id, user_id, original_name, mime_type, size_bytes, created_at`,
      [
        activityId,
        req.user.id,
        req.file.originalname,
        req.file.filename,
        req.file.mimetype,
        req.file.size,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ message: 'Failed to upload attachment' });
  }
};

export const downloadAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activityId = Number.parseInt(req.params.id, 10);
    const attachmentId = Number.parseInt(req.params.attachmentId, 10);
    if (Number.isNaN(activityId) || Number.isNaN(attachmentId) || !req.user) {
      res.status(400).json({ message: 'Invalid ids' });
      return;
    }
    if (!(await canAccessActivity(activityId, req.user.id, req.user.profile))) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const result = await pool.query(
      `SELECT * FROM activity_attachments WHERE id = $1 AND activity_id = $2`,
      [attachmentId, activityId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Attachment not found' });
      return;
    }

    const filePath = path.join(uploadsRoot, result.rows[0].stored_name);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'File missing on disk' });
      return;
    }

    res.download(filePath, result.rows[0].original_name);
  } catch {
    res.status(500).json({ message: 'Failed to download attachment' });
  }
};

export const listNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ message: 'Failed to list notifications' });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    await pool.query(
      `UPDATE notifications SET read_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Failed to mark notification' });
  }
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    await pool.query(
      `UPDATE notifications SET read_at = NOW()
       WHERE user_id = $1 AND read_at IS NULL`,
      [req.user.id]
    );
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Failed to mark notifications' });
  }
};

export { uploadsRoot, ensureUploadsDir };
