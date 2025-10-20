import * as cron from 'node-cron';
import logger from '@/utils/logger';
import catalogSyncService from './catalogSyncService';

class CatalogCronService {
  private syncTask: cron.ScheduledTask | null = null;

  /**
   * Initialize catalog synchronization cron job
   * Runs every 30 minutes
   */
  public initialize(): void {
    try {
      // Schedule catalog sync every 30 minutes
      this.syncTask = cron.schedule('*/30 * * * *', async () => {
        logger.info('⏰ Scheduled catalog sync triggered');
        
        try {
          const results = await catalogSyncService.syncAllShops();
          
          const successful = results.filter((r) => r.success).length;
          const failed = results.length - successful;
          
          logger.info(`✅ Scheduled sync completed: ${successful} successful, ${failed} failed`);
        } catch (error) {
          logger.error('❌ Error in scheduled catalog sync:', error);
        }
      });

      logger.info('✅ Catalog sync cron job initialized (every 30 minutes)');

      // Run initial sync after 10 seconds
      setTimeout(async () => {
        logger.info('🚀 Running initial catalog sync...');
        try {
          const results = await catalogSyncService.syncAllShops();
          const successful = results.filter((r) => r.success).length;
          const failed = results.length - successful;
          logger.info(`✅ Initial sync completed: ${successful} successful, ${failed} failed`);
        } catch (error) {
          logger.error('❌ Error in initial catalog sync:', error);
        }
      }, 10000); // 10 seconds delay

    } catch (error) {
      logger.error('❌ Failed to initialize catalog cron service:', error);
    }
  }

  /**
   * Stop the cron job
   */
  public stop(): void {
    if (this.syncTask) {
      this.syncTask.stop();
      logger.info('🛑 Catalog sync cron job stopped');
    }
  }

  /**
   * Start the cron job (if it was stopped)
   */
  public start(): void {
    if (this.syncTask) {
      this.syncTask.start();
      logger.info('▶️ Catalog sync cron job started');
    }
  }

  /**
   * Get cron job status
   */
  public getStatus(): { running: boolean; schedule: string } {
    return {
      running: this.syncTask !== null,
      schedule: '*/30 * * * *', // Every 30 minutes
    };
  }
}

export default new CatalogCronService();

