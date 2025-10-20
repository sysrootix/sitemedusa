import { Request, Response } from 'express';
import Vacancy from '@/models/Vacancy';
import VacancyResponse from '@/models/VacancyResponse';
import { ApiResponse } from '@/types';
import logger from '@/utils/logger';

class VacancyController {
  public async list(req: Request, res: Response): Promise<void> {
    try {
      const vacancies = await Vacancy.findAll({
        order: [['created_at', 'DESC']],
      });

      const response: ApiResponse = {
        success: true,
        message: 'Vacancies retrieved successfully',
        data: { vacancies },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching vacancies:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vacancies',
        errors: ['Internal server error'],
      });
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const vacancy = await Vacancy.findByPk(id);
      if (!vacancy) {
        res.status(404).json({
          success: false,
          message: 'Vacancy not found',
          errors: ['Vacancy with the specified ID does not exist'],
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Vacancy retrieved successfully',
        data: { vacancy },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching vacancy:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vacancy',
        errors: ['Internal server error'],
      });
    }
  }
}

class VacancyResponseController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const { vacancy_id, full_name, phone, username, vacancy_title, text } = req.body;

      // Validate required fields
      if (!vacancy_id || !full_name || !phone || !vacancy_title) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
          errors: ['vacancy_id, full_name, phone, and vacancy_title are required'],
        });
        return;
      }

      // Create vacancy response record
      const vacancyResponseData: any = {
        full_name: full_name.trim(),
        phone: phone.trim(),
        vacancy_title: vacancy_title.trim(),
      };

      // Add optional fields only if they have values
      if (username?.trim()) {
        vacancyResponseData.username = username.trim();
      }
      if (text?.trim()) {
        vacancyResponseData.text = text.trim();
      }

      const response = await VacancyResponse.create(vacancyResponseData);

      logger.info(`✅ New vacancy response created: ${response.id} for vacancy ${vacancy_title}`);

      const apiResponse: ApiResponse = {
        success: true,
        message: 'Vacancy response submitted successfully',
        data: {
          id: response.id,
        },
      };

      res.status(201).json(apiResponse);
    } catch (error) {
      logger.error('❌ Error creating vacancy response:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit vacancy response',
        errors: ['Internal server error'],
      });
    }
  }

  public async list(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const { count, rows: responses } = await VacancyResponse.findAndCountAll({
        limit,
        offset,
        order: [['created_at', 'DESC']],
      });

      const response: ApiResponse = {
        success: true,
        message: 'Vacancy responses retrieved successfully',
        data: {
          responses,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: limit,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching vacancy responses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vacancy responses',
        errors: ['Internal server error'],
      });
    }
  }
}

export default {
  VacancyController: new VacancyController(),
  VacancyResponseController: new VacancyResponseController(),
};
