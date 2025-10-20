import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  nodeEnv: string;
  port: number;
  host: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  telegram: {
    botToken: string;
    botUsername: string;
  };
  security: {
    bcryptRounds: number;
    cookieSecret: string;
  };
  cors: {
    frontendUrl: string;
    allowedOrigins: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    filePath: string;
  };
}

const requiredEnvVars = [
  'PORT',
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'TELEGRAM_BOT_TOKEN',
  'FRONTEND_URL'
];

// Validate required environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '55001', 10),
  host: process.env.HOST || 'localhost',
  
  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN!,
    botUsername: process.env.TELEGRAM_BOT_USERNAME || '',
  },
  
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    cookieSecret: process.env.COOKIE_SECRET || 'default-cookie-secret',
  },
  
  cors: {
    frontendUrl: process.env.FRONTEND_URL!,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [process.env.FRONTEND_URL!],
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10000', 10), // Увеличено в 10 раз
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
  },
};

// Validate configuration
if (config.port < 1 || config.port > 65535) {
  throw new Error('PORT must be between 1 and 65535');
}

if (config.security.bcryptRounds < 10 || config.security.bcryptRounds > 15) {
  throw new Error('BCRYPT_ROUNDS must be between 10 and 15');
}

export default config;
