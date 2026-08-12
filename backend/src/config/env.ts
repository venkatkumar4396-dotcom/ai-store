import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  CORS_ORIGIN: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  ENCRYPTION_KEY: string;
  GEMINI_API_KEY: string;
  KIMI_API_KEY: string;
  KIMI_BASE_URL: string;
  KIMI_MODEL: string;
  OLLAMA_BASE_URL: string;
  OLLAMA_MODEL: string;
  WHATSAPP_SESSION_PATH: string;
  UPLOAD_DIR: string;
  MAX_FILE_SIZE: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  LOG_LEVEL: string;
  // SMTP for OTP email delivery
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
}

function getEnvString(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

function getEnvNumber(key: string, fallback: number): number {
  const val = process.env[key];
  if (val === undefined || val === '') return fallback;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}

const env: EnvConfig = {
  PORT: getEnvNumber('PORT', 5000),
  NODE_ENV: getEnvString('NODE_ENV', 'development'),
  CORS_ORIGIN: getEnvString('CORS_ORIGIN', 'http://localhost:3000'),
  DATABASE_URL: getEnvString('DATABASE_URL', 'file:./dev.db'),
  JWT_SECRET: getEnvString('JWT_SECRET', 'default-dev-secret-change-me'),
  JWT_EXPIRES_IN: getEnvString('JWT_EXPIRES_IN', '7d'),
  ENCRYPTION_KEY: getEnvString('ENCRYPTION_KEY', 'default-32-char-encryption-key!!'),
  GEMINI_API_KEY: getEnvString('GEMINI_API_KEY', ''),
  KIMI_API_KEY: getEnvString('KIMI_API_KEY', ''),
  KIMI_BASE_URL: getEnvString('KIMI_BASE_URL', 'https://api.moonshot.ai/v1'),
  KIMI_MODEL: getEnvString('KIMI_MODEL', 'moonshot-v1-128k'),
  OLLAMA_BASE_URL: getEnvString('OLLAMA_BASE_URL', 'http://localhost:11434'),
  OLLAMA_MODEL: getEnvString('OLLAMA_MODEL', 'llama3'),
  WHATSAPP_SESSION_PATH: getEnvString('WHATSAPP_SESSION_PATH', './data/whatsapp-sessions'),
  UPLOAD_DIR: getEnvString('UPLOAD_DIR', './data/uploads'),
  MAX_FILE_SIZE: getEnvNumber('MAX_FILE_SIZE', 10485760),
  RATE_LIMIT_WINDOW_MS: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000),
  RATE_LIMIT_MAX_REQUESTS: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  LOG_LEVEL: getEnvString('LOG_LEVEL', 'info'),
  // SMTP for OTP email delivery (optional — falls back to console log in dev)
  SMTP_HOST: getEnvString('SMTP_HOST', ''),
  SMTP_PORT: getEnvNumber('SMTP_PORT', 587),
  SMTP_USER: getEnvString('SMTP_USER', ''),
  SMTP_PASS: getEnvString('SMTP_PASS', ''),
  SMTP_FROM: getEnvString('SMTP_FROM', 'noreply@nexora.ai'),
};

// ─── Production Safety Checks ───────────────────────────────
// Crash immediately if critical secrets are missing or insecure in production
if (env.NODE_ENV === 'production') {
  const errors: string[] = [];

  if (env.JWT_SECRET === 'default-dev-secret-change-me' || env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be set to a secure value (min 32 chars) in production.');
  }
  if (env.ENCRYPTION_KEY === 'default-32-char-encryption-key!!' || env.ENCRYPTION_KEY.length < 32) {
    errors.push('ENCRYPTION_KEY must be set to a secure value (min 32 chars) in production.');
  }
  if (!env.GEMINI_API_KEY && !process.env.OLLAMA_BASE_URL) {
    errors.push('At least one AI provider must be configured: GEMINI_API_KEY or OLLAMA_BASE_URL.');
  }
  if (env.DATABASE_URL === 'file:./dev.db') {
    errors.push('DATABASE_URL should not use SQLite dev.db in production. Use PostgreSQL.');
  }

  if (errors.length > 0) {
    console.error('\n╔═══════════════════════════════════════════════════╗');
    console.error('║  FATAL: Production environment misconfigured!     ║');
    console.error('╚═══════════════════════════════════════════════════╝\n');
    errors.forEach((e) => console.error(`  ✖ ${e}`));
    console.error('\nSet these environment variables and restart.\n');
    process.exit(1);
  }
}

export default env;

