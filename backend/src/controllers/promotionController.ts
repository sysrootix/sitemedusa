import { Request, Response } from 'express';
import Promotion from '@/models/Promotion';
import { ApiResponse } from '@/types';
import logger from '@/utils/logger';

class PromotionController {
  public async list(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(String(req.query.limit || '12'), 10) || 12, 1), 50);
      const offset = (page - 1) * limit;

      const { rows, count } = await Promotion.findAndCountAll({
        where: {
          // Показываем только активные акции (не истекшие)
        },
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      // Фильтруем активные акции на уровне приложения
      const activePromotions = rows.filter((promotion) => promotion.isActive());

      const totalPages = Math.ceil(count / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      const response: ApiResponse<{
        promotions: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      }> = {
        success: true,
        message: 'Акции получены успешно',
        data: {
          promotions: activePromotions.map((promotion) => promotion.toPublicJSON()),
          pagination: {
            page,
            limit,
            total: count,
            totalPages,
            hasNextPage,
            hasPrevPage,
          },
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching promotions:', error);
      const response: ApiResponse<null> = {
        success: false,
        message: 'Не удалось получить список акций',
        errors: ['PROMOTION_FETCH_ERROR'],
      };
      res.status(500).json(response);
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const promotion = await Promotion.findByPk(id);

      if (!promotion) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Акция не найдена',
        errors: ['PROMOTION_NOT_FOUND'],
      };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<any> = {
        success: true,
        message: 'Акция найдена',
        data: promotion.toPublicJSON(),
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching promotion by ID:', error);
      const response: ApiResponse<null> = {
        success: false,
        message: 'Не удалось получить акцию',
        errors: ['PROMOTION_FETCH_ERROR'],
      };
      res.status(500).json(response);
    }
  }

  public async getActive(req: Request, res: Response): Promise<void> {
    try {
      const promotions = await Promotion.findActiveWithExpiration();

      const response: ApiResponse<any[]> = {
        success: true,
        message: 'Активные акции получены',
        data: promotions.map((promotion) => promotion.toPublicJSON()),
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching active promotions:', error);
      const response: ApiResponse<null> = {
        success: false,
        message: 'Не удалось получить активные акции',
        errors: ['ACTIVE_PROMOTIONS_FETCH_ERROR'],
      };
      res.status(500).json(response);
    }
  }
}

export default new PromotionController();
