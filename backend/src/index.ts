// Global error handlers FIRST
process.on('uncaughtException', (error) => {
  console.error('\n\n❌❌❌ UNCAUGHT EXCEPTION ❌❌❌');
  console.error('Error:', error);
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  console.error('\n\n');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n\n❌❌❌ UNHANDLED REJECTION ❌❌❌');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  if (reason instanceof Error) {
    console.error('Stack:', reason.stack);
  }
  console.error('\n\n');
  process.exit(1);
});

import 'express-async-errors';
import express from 'express';
import { config } from '@/config';
import { testConnection, syncDatabase } from '@/config/database';
import { initializeModels } from '@/models';
import routes from '@/routes';
import {
  security,
  corsMiddleware,
  compressionMiddleware,
  requestLogging,
  rateLimiter,
  cookies,
  requestId,
  errorHandler,
  notFoundHandler,
} from '@/middleware';
import logger from '@/utils/logger';
import catalogCronService from '@/services/catalogCronService';

class App {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.port;

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize middleware
   */
  private initializeMiddleware(): void {
    // Trust proxy for correct IP detection behind reverse proxy
    this.app.set('trust proxy', 1);

    // Security middleware
    this.app.use(security);
    
    // CORS middleware
    this.app.use(corsMiddleware);
    
    // Compression middleware
    this.app.use(compressionMiddleware);
    
    // Request logging
    this.app.use(requestLogging);
    
    // Rate limiting
    this.app.use(rateLimiter);
    
    // Cookie parser
    this.app.use(cookies);
    
    // Request ID
    this.app.use(requestId);
    
    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Static files (for uploaded files)
    this.app.use('/uploads', express.static('uploads'));
    
    logger.info('✅ Middleware initialized');
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // API routes
    this.app.use('/api', routes);
    
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Medusa Vape Shop API Server',
        data: {
          status: 'online',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          environment: config.nodeEnv,
          endpoints: {
            api: '/api',
            health: '/api/health',
            docs: '/api',
          },
        },
      });
    });
    
    logger.info('✅ Routes initialized');
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
    
    logger.info('✅ Error handling initialized');
  }

  /**
   * Initialize database
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // Test database connection
      await testConnection();

      // Initialize models
      await initializeModels();

      // Sync database in development
      if (config.nodeEnv === 'development') {
        await syncDatabase(false);
      }

      logger.info('✅ Database initialized successfully');
    } catch (error) {
      logger.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      logger.info('🔄 Starting application...');
      
      // Initialize database
      logger.info('🔄 Initializing database...');
      await this.initializeDatabase();
      logger.info('✅ Database initialization complete');
      
      // Initialize catalog cron service
      logger.info('🔄 Initializing catalog cron service...');
      catalogCronService.initialize();
      logger.info('✅ Catalog cron service initialized');
      
      // Start server
      logger.info(`🔄 Starting HTTP server on ${config.host}:${this.port}...`);
      const server = this.app.listen(this.port, config.host, () => {
        logger.info(`🚀 Server running on http://${config.host}:${this.port}`);
        logger.info(`📝 Environment: ${config.nodeEnv}`);
        logger.info(`📊 API Documentation: http://${config.host}:${this.port}/api`);
        logger.info(`🏥 Health Check: http://${config.host}:${this.port}/api/health`);
        
        if (config.nodeEnv === 'development') {
          logger.info(`🔧 Development mode: Database auto-sync enabled`);
        }
      });

      // Graceful shutdown
      const gracefulShutdown = (signal: string) => {
        logger.info(`📢 Received ${signal}. Shutting down gracefully...`);
        
        server.close(async () => {
          logger.info('🔒 HTTP server closed');
          
          try {
            // Stop catalog cron service
            catalogCronService.stop();
            
            // Close database connection
            const { closeConnection } = await import('@/config/database');
            await closeConnection();
            
            logger.info('✅ Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            logger.error('❌ Error during shutdown:', error);
            process.exit(1);
          }
        });
        
        // Force close after 30 seconds
        setTimeout(() => {
          logger.error('⚠️ Could not close connections in time, forcefully shutting down');
          process.exit(1);
        }, 30000);
      };

      // Handle shutdown signals
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      
      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        logger.error('❌ Uncaught Exception:', error);
        gracefulShutdown('UNCAUGHT_EXCEPTION');
      });
      
      // Handle unhandled promise rejections
      process.on('unhandledRejection', (reason, promise) => {
        logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        gracefulShutdown('UNHANDLED_REJECTION');
      });

    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Get Express app instance
   */
  public getApp(): express.Application {
    return this.app;
  }
}

// Create and start the application
logger.info('🔧 Creating App instance...');
const app = new App();
logger.info('✅ App instance created');

// Start server if this file is run directly
if (require.main === module) {
  logger.info('🚀 Module is main, starting app...');
  app.start().catch((error) => {
    logger.error('❌ Application startup failed:', error);
    console.error('Full error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  });
}

export default app;
