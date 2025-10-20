import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Article from '@/models/Article';
import User from '@/models/User';
import ArticleCategory from '@/models/ArticleCategory';
import { ApiResponse } from '@/types';
import logger from '@/utils/logger';

class ArticleController {
  public async list(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(String(req.query.limit || '12'), 10) || 12, 1), 50);
      const offset = (page - 1) * limit;
      const query = (req.query.query as string) || (req.query.q as string) || '';
      const categoryId = (req.query.category_id as string) || undefined;

      const where: any = {
        status: 'published',
        [Op.and]: [
          { published_at: { [Op.ne]: null } },
          { published_at: { [Op.lte]: new Date() } }
        ]
      };

      if (query) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${query}%` } },
          { content: { [Op.iLike]: `%${query}%` } },
          { excerpt: { [Op.iLike]: `%${query}%` } },
        ];
      }

      if (categoryId) {
        where.category_id = categoryId;
      }

      const { rows, count } = await Article.findAndCountAll({
        where,
        include: [
          { model: User, as: 'articleAuthor', attributes: ['id', 'username', 'first_name', 'last_name', 'photo_url'] },
          { model: ArticleCategory, as: 'category', attributes: ['id', 'name', 'slug'] },
        ],
        order: [['published_at', 'DESC']],
        limit,
        offset,
      });

      const articles = rows.map((article) => {
        const data = (article as any).toPublicJSON ? (article as any).toPublicJSON() : article.toJSON();
        const author = (article as any).articleAuthor;
        const category = (article as any).category;
        return {
          ...data,
          author: author ? (author as any).toPublicJSON ? (author as any).toPublicJSON() : author : undefined,
          category: category || undefined,
        };
      });

      const response: ApiResponse = {
        success: true,
        message: 'Articles retrieved successfully',
        data: { articles },
        meta: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching articles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch articles',
        errors: ['Internal server error'],
      });
    }
  }

  public async detail(req: Request, res: Response): Promise<void> {
    try {
      const slug = req.params.slug;

      const article = await Article.findOne({
        where: {
          slug,
          status: 'published',
          [Op.and]: [
            { published_at: { [Op.ne]: null } },
            { published_at: { [Op.lte]: new Date() } }
          ]
        },
        include: [
          { model: User, as: 'articleAuthor', attributes: ['id', 'username', 'first_name', 'last_name', 'photo_url'] },
          { model: ArticleCategory, as: 'category', attributes: ['id', 'name', 'slug'] },
        ],
      });

      if (!article) {
        res.status(404).json({
          success: false,
          message: 'Article not found',
          errors: ['Article does not exist'],
        });
        return;
      }

      const data = (article as any).toPublicJSON ? (article as any).toPublicJSON() : article.toJSON();
      const author = (article as any).articleAuthor;
      const category = (article as any).category;

      const response: ApiResponse = {
        success: true,
        message: 'Article retrieved successfully',
        data: {
          ...data,
          author: author ? (author as any).toPublicJSON ? (author as any).toPublicJSON() : author : undefined,
          category: category || undefined,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('❌ Error fetching article detail:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch article detail',
        errors: ['Internal server error'],
      });
    }
  }
}

export default new ArticleController();


