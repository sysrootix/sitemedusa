import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from '@/config';
import { morganStream } from '@/utils/logger';
import logger from '@/utils/logger';

/**
 * Security middleware
 */
export const security = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://telegram.org"],
      connectSrc: ["'self'", "https://api.telegram.org"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/**
 * CORS middleware
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (config.cors.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    const error = new Error(`CORS policy violation: Origin ${origin} not allowed`);
    logger.warn(`CORS blocked origin: ${origin}`);
    callback(error, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-Request-ID',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
});

/**
 * Compression middleware
 */
export const compressionMiddleware = compression({
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
});

/**
 * Request logging middleware
 */
export const requestLogging = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms',
  {
    stream: morganStream,
    skip: (req, res) => {
      // Skip health check requests in production
      if (config.nodeEnv === 'production' && req.url === '/health') {
        return true;
      }
      return false;
    },
  }
);

/**
 * Rate limiting middleware
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Ой, вы так быстро кликаете! 💨',
    errors: ['Слишком много запросов. Пожалуйста, подождите немного и попробуйте снова.'],
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Ой, вы так быстро кликаете! 💨',
      errors: ['Слишком много запросов. Пожалуйста, подождите немного и попробуйте снова.'],
    });
  },
});

/**
 * Strict rate limiting for auth endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts',
    errors: ['Too many login attempts. Please try again later.'],
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts',
      errors: ['Too many login attempts. Please try again later.'],
    });
  },
});

/**
 * Cookie parser middleware
 */
export const cookies = cookieParser(config.security.cookieSecret);

/**
 * Request ID middleware
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

/**
 * Error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string;
  
  logger.error('Request error:', {
    requestId,
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: [error.message],
      requestId,
    });
    return;
  }

  if (error.name === 'SequelizeValidationError') {
    res.status(400).json({
      success: false,
      message: 'Database validation error',
      errors: [(error as any).errors?.map((e: any) => e.message) || [error.message]].flat(),
      requestId,
    });
    return;
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      errors: ['Resource already exists'],
      requestId,
    });
    return;
  }

  // Default error response
  const isDevelopment = config.nodeEnv === 'development';
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: ['An unexpected error occurred'],
    requestId,
    ...(isDevelopment && { stack: error.stack }),
  });
};

/**
 * 404 handler middleware
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const requestId = req.headers['x-request-id'] as string;
  
  logger.warn(`404 Not Found: ${req.method} ${req.url}`, {
    requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json({
    success: false,
    message: 'Route not found',
    errors: [`Cannot ${req.method} ${req.url}`],
    requestId,
  });
};

/**
 * Health check middleware
 */
export const healthCheck = (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      node: process.version,
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      },
    },
  });
};

export default {
  security,
  corsMiddleware,
  compressionMiddleware,
  requestLogging,
  rateLimiter,
  authRateLimiter,
  cookies,
  requestId,
  errorHandler,
  notFoundHandler,
  healthCheck,
};
