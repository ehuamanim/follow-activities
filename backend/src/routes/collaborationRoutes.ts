import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import {
  listComments,
  createComment,
  listAttachments,
  uploadAttachment,
  downloadAttachment,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  ensureUploadsDir,
  uploadsRoot,
} from '../controllers/collaborationController';
import { authenticate } from '../middleware/authMiddleware';

ensureUploadsDir();

const allowedMime = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadsDir();
    cb(null, uploadsRoot);
  },
  filename: (_req, file, cb) => {
    const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xls' || ext === '.xlsm') {
      cb(new Error('Tipo de archivo no permitido'));
      return;
    }
    if (!allowedMime.has(file.mimetype)) {
      cb(new Error('Tipo de archivo no permitido'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.use(authenticate);

router.get('/notifications', listNotifications);
router.post('/notifications/read-all', markAllNotificationsRead);
router.post('/notifications/:id/read', markNotificationRead);

router.get('/activities/:id/comments', listComments);
router.post('/activities/:id/comments', createComment);
router.get('/activities/:id/attachments', listAttachments);
router.post('/activities/:id/attachments', upload.single('file'), uploadAttachment);
router.get('/activities/:id/attachments/:attachmentId/download', downloadAttachment);

export default router;
