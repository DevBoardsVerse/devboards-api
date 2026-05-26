import * as Joi from 'joi';

// Joi schema — validates every env variable at startup
// If anything is missing or wrong type, app refuses to start
export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional().default(''),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Mail
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().default(2525),
  MAIL_USER: Joi.string().required(),
  MAIL_PASS: Joi.string().required(),
  MAIL_FROM: Joi.string().default('noreply@devboard.com'),

  // File Upload
  R2_ACCOUNT_ID: Joi.string().optional().default('disabled'),
  R2_ACCESS_KEY_ID: Joi.string().optional().default('disabled'),
  R2_SECRET_ACCESS_KEY: Joi.string().optional().default('disabled'),
  R2_BUCKET_NAME: Joi.string().optional().default('disabled'),
  R2_PUBLIC_URL: Joi.string().optional().default('disabled'),
});