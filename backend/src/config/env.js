const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development','production','test']).default('development'),
  PORT: z.string().optional(),
  FRONTEND_URL: z.string().url().optional(),
  FRONTEND_ORIGINS: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  ACCESS_TOKEN_TTL_MINUTES: z.string().optional().default('15'),
  REFRESH_TOKEN_TTL_DAYS: z.string().optional().default('30'),
  LOG_LEVEL: z.string().optional().default('info'),
});

let _parsed;
function loadEnv() {
  if (_parsed) return _parsed;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment configuration');
    result.error.issues.forEach(i => console.error(` - ${i.path.join('.')}: ${i.message}`));
    process.exit(1);
  }
  _parsed = result.data;
  return _parsed;
}

module.exports = { loadEnv };
