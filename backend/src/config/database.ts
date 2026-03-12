import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isLambda = !!process.env.LAMBDA_TASK_ROOT;
const useSSL = process.env.DB_SSL === 'true';

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'follow_activities',
  ssl: useSSL
    ? {
        // For RDS/Aurora use TLS in transit. Set DB_SSL_REJECT_UNAUTHORIZED=true
        // only when you provide a trusted CA chain in the runtime.
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
      }
    : undefined,
  // Lambda-specific optimizations
  max: isLambda ? 2 : 10,
  idleTimeoutMillis: isLambda ? 1000 : 30000,
  connectionTimeoutMillis: 5000,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});
