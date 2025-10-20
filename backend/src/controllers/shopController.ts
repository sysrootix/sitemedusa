import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '@/config/database';
import ShopLocation from '@/models/ShopLocation';
import { ApiResponse } from '@/types';
import logger from '@/utils/logger';

class ShopController {
  public async list(req: Request, res: Response): Promise<void> {
    try {
      const city = (req.query.city as string) || undefined;

      const where: any = { is_active: true };
      if (city) {
        where.city = { [Op.iLike]: city };
      }

      const shops = await ShopLocation.findAll({
        where,
        order: [
          ['priority_order', 'DESC'],
          ['shop_name', 'ASC'],
        ],
      });

      const response: ApiResponse = {
        success: true,
        message: 'Shops retrieved successfully',
        data: { shops },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching shops:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch shops',
        errors: ['Internal server error'],
      });
    }
  }

  public async getCities(req: Request, res: Response): Promise<void> {
    try {
      const cities = await ShopLocation.findAll({
        where: { is_active: true },
        attributes: [
          [sequelize.fn('DISTINCT', sequelize.col('city')), 'city']
        ],
        raw: true,
      });

      const cityList = cities
        .map((item: any) => item.city)
        .filter((city: string | null) => city !== null)
        .sort();

      const response: ApiResponse = {
        success: true,
        message: 'Cities retrieved successfully',
        data: { cities: cityList },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching cities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cities',
        errors: ['Internal server error'],
      });
    }
  }
}

export default new ShopController();


