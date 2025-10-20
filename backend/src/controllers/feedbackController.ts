import { Request, Response } from 'express';
import FeedbackSite, { FeedbackStatus, FeedbackPriority } from '@/models/FeedbackSite';
import { ApiResponse } from '@/types';
import logger from '@/utils/logger';

interface FeedbackRequest {
  name: string;
  telegram?: string;
  phone?: string;
  subject: string;
  message: string;
}

class FeedbackController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, telegram, phone, subject, message }: FeedbackRequest = req.body;

      // Validate required fields
      if (!name || !subject || !message) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
          errors: ['Name, subject, and message are required'],
        });
        return;
      }

      // Create feedback record
      const feedbackData: any = {
        name: name.trim(),
        subject: subject.trim(),
        message: message.trim(),
        status: FeedbackStatus.PENDING,
        priority: FeedbackPriority.MEDIUM,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      };

      // Add optional fields only if they have values
      if (telegram?.trim()) {
        feedbackData.telegram = telegram.trim();
      }
      if (phone?.trim()) {
        feedbackData.phone = phone.trim();
      }

      const feedback = await FeedbackSite.create(feedbackData);

      logger.info(`✅ New feedback created: ${feedback.id} from ${name}`);

      const response: ApiResponse = {
        success: true,
        message: 'Feedback submitted successfully',
        data: {
          id: feedback.id,
          status: feedback.status,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('❌ Error creating feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback',
        errors: ['Internal server error'],
      });
    }
  }

  public async list(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as FeedbackStatus;
      const priority = req.query.priority as FeedbackPriority;
      const offset = (page - 1) * limit;

      const where: any = {};
      if (status) where.status = status;
      if (priority) where.priority = priority;

      const { count, rows: feedbacks } = await FeedbackSite.findAndCountAll({
        where,
        limit,
        offset,
        order: [['created_at', 'DESC']],
      });

      const response: ApiResponse = {
        success: true,
        message: 'Feedback list retrieved successfully',
        data: {
          feedbacks,
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
      logger.error('❌ Error fetching feedback list:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback list',
        errors: ['Internal server error'],
      });
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const feedback = await FeedbackSite.findByPk(id);
      if (!feedback) {
        res.status(404).json({
          success: false,
          message: 'Feedback not found',
          errors: ['Feedback with the specified ID does not exist'],
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Feedback retrieved successfully',
        data: { feedback },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback',
        errors: ['Internal server error'],
      });
    }
  }

  public async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes, assigned_to } = req.body;

      const feedback = await FeedbackSite.findByPk(id);
      if (!feedback) {
        res.status(404).json({
          success: false,
          message: 'Feedback not found',
          errors: ['Feedback with the specified ID does not exist'],
        });
        return;
      }

      // Update fields
      if (status) feedback.status = status;
      if (notes !== undefined) feedback.notes = notes;
      if (assigned_to) feedback.assigned_to = assigned_to;

      // Mark as completed if status is completed
      if (status === FeedbackStatus.COMPLETED) {
        feedback.response_sent = true;
        feedback.response_date = new Date();
      }

      await feedback.save();

      logger.info(`✅ Feedback ${id} status updated to ${status}`);

      const response: ApiResponse = {
        success: true,
        message: 'Feedback status updated successfully',
        data: { feedback },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error updating feedback status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update feedback status',
        errors: ['Internal server error'],
      });
    }
  }

  public async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await FeedbackSite.findAll({
        attributes: [
          'status',
          [FeedbackSite.sequelize!.fn('COUNT', FeedbackSite.sequelize!.col('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      });

      const total = await FeedbackSite.count();
      const pending = await FeedbackSite.count({ where: { status: FeedbackStatus.PENDING } });
      const completed = await FeedbackSite.count({ where: { status: FeedbackStatus.COMPLETED } });

      const response: ApiResponse = {
        success: true,
        message: 'Feedback statistics retrieved successfully',
        data: {
          total,
          pending,
          completed,
          byStatus: stats,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching feedback stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback statistics',
        errors: ['Internal server error'],
      });
    }
  }
}

export default new FeedbackController();
