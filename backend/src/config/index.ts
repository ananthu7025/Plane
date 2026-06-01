import { z } from 'zod';

const configSchema = z.object({
  // Server
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),
  DB_POOL_MAX: z.coerce.number().default(20),
  DB_POOL_MIN: z.coerce.number().default(5),
  DB_IDLE_TIMEOUT: z.coerce.number().default(30000),
  DB_CONNECTION_TIMEOUT: z.coerce.number().default(2000),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('1m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),

  // OTP
  OTP_EXPIRY_MINUTES: z.coerce.number().default(15),
  OTP_LENGTH: z.coerce.number().default(6),

  // Email
  RESEND_API_KEY: z.string(),
  EMAIL_FROM: z.string().email(),
  EMAIL_QUEUE_BATCH_SIZE: z.coerce.number().default(10),
  EMAIL_QUEUE_INTERVAL_MS: z.coerce.number().default(5000),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_AUTH_WINDOW: z.coerce.number().default(900000),
  RATE_LIMIT_AUTH_ATTEMPTS: z.coerce.number().default(5),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  CLOUDINARY_FOLDER: z.string().default('planeandprop'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FILE: z.string().optional(),
});

export const config = configSchema.parse(process.env);

export default config;
