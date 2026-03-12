import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import activityRoutes from './routes/activityRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import roleRoutes from './routes/roleRoutes';

const app = express();
const isServerlessRuntime = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV);

// API Gateway forwards client IP through X-Forwarded-For. Express must trust the proxy in Lambda.
app.set('trust proxy', isServerlessRuntime ? 1 : false);

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Body parsing
const jsonParser = express.json({ limit: '1mb' });

app.use((req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    next();
    return;
  }

  // In Lambda/API Gateway the adapter may already provide req.body or an
  // attached API Gateway event body. Re-parsing the stream can fail.
  const currentBody = req.body as unknown;

  if (typeof currentBody === 'string') {
    try {
      req.body = currentBody.length > 0 ? JSON.parse(currentBody) : {};
      next();
      return;
    } catch {
      res.status(400).json({ message: 'Invalid JSON body' });
      return;
    }
  }

  if (Buffer.isBuffer(currentBody)) {
    try {
      const raw = currentBody.toString('utf8');
      req.body = raw.length > 0 ? JSON.parse(raw) : {};
      next();
      return;
    } catch {
      res.status(400).json({ message: 'Invalid JSON body' });
      return;
    }
  }

  if (currentBody && typeof currentBody === 'object' && Object.keys(currentBody as object).length > 0) {
    next();
    return;
  }

  const apiGatewayEvent = (req as express.Request & {
    apiGateway?: { event?: { body?: string | null; isBase64Encoded?: boolean } };
  }).apiGateway?.event;

  if (isServerlessRuntime && apiGatewayEvent?.body) {
    try {
      const rawBody = apiGatewayEvent.isBase64Encoded
        ? Buffer.from(apiGatewayEvent.body, 'base64').toString('utf8')
        : apiGatewayEvent.body;

      req.body = rawBody.length > 0 ? JSON.parse(rawBody) : {};
      next();
      return;
    } catch {
      res.status(400).json({ message: 'Invalid JSON body' });
      return;
    }
  }

  jsonParser(req, res, next);
});

// In API Gateway stage URLs (e.g. /dev/api/...), strip the stage prefix so
// Express routes mounted at /api/... continue matching.
app.use((req, _res, next) => {
  if (!isServerlessRuntime) {
    next();
    return;
  }

  const stage = process.env.NODE_ENV;
  if (!stage) {
    next();
    return;
  }

  const stagePrefix = `/${stage}`;
  if (req.url === stagePrefix) {
    req.url = '/';
  } else if (req.url.startsWith(`${stagePrefix}/`)) {
    req.url = req.url.slice(stagePrefix.length);
  }

  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/roles', roleRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
