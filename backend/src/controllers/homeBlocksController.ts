import { Request, Response } from 'express';
import { ApiResponse } from '@/types';

interface HomeBlock {
  id: string;
  title: string;
  description: string;
  isVisible: boolean;
  order: number;
}

interface HomeBlocksConfig {
  blocks: HomeBlock[];
}

// Конфигурация блоков по умолчанию
const defaultBlocksConfig: HomeBlocksConfig = {
  blocks: [
    {
      id: 'hero',
      title: 'Добро пожаловать в Medusa',
      description: 'Главный баннер с приветствием',
      isVisible: true,
      order: 1
    },
    {
      id: 'why-choose-us',
      title: 'Почему выбирают нас',
      description: 'Блок с преимуществами',
      isVisible: true,
      order: 2
    },
    {
      id: 'popular-products',
      title: 'Популярные товары',
      description: 'Блок с популярными продуктами',
      isVisible: true,
      order: 3
    },
    {
      id: 'bonus-program',
      title: 'Бонусная программа',
      description: 'Блок с описанием бонусной программы',
      isVisible: true,
      order: 4
    },
    {
      id: 'cta',
      title: 'Готовы начать свой вейп-путь?',
      description: 'Призыв к действию',
      isVisible: true,
      order: 5
    }
  ]
};

// Простое хранилище в памяти (в продакшене можно использовать Redis или базу данных)
let currentBlocksConfig: HomeBlocksConfig = { ...defaultBlocksConfig };

class HomeBlocksController {
  /**
   * Получить конфигурацию блоков главной страницы
   */
  async getBlocksConfig(req: Request, res: Response): Promise<void> {
    try {
      const response: ApiResponse<HomeBlocksConfig> = {
        success: true,
        message: 'Конфигурация блоков получена успешно',
        data: currentBlocksConfig
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting blocks config:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Ошибка при получении конфигурации блоков'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Обновить конфигурацию блоков главной страницы
   */
  async updateBlocksConfig(req: Request, res: Response): Promise<void> {
    try {
      const { blocks } = req.body;

      // Валидация входных данных
      if (!Array.isArray(blocks)) {
        const response: ApiResponse = {
          success: false,
          message: 'Неверный формат данных. Ожидается массив блоков.'
        };
        res.status(400).json(response);
        return;
      }

      // Проверяем структуру каждого блока
      for (const block of blocks) {
        if (!block.id || typeof block.isVisible !== 'boolean' || typeof block.order !== 'number') {
          const response: ApiResponse = {
            success: false,
            message: 'Неверная структура блока. Каждый блок должен содержать id, isVisible и order.'
          };
          res.status(400).json(response);
          return;
        }
      }

      // Обновляем конфигурацию
      currentBlocksConfig = { blocks };

      const response: ApiResponse<HomeBlocksConfig> = {
        success: true,
        message: 'Конфигурация блоков обновлена успешно',
        data: currentBlocksConfig
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating blocks config:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Ошибка при обновлении конфигурации блоков'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Включить/отключить блок
   */
  async toggleBlock(req: Request, res: Response): Promise<void> {
    try {
      const { blockId } = req.params;
      const { isVisible } = req.body;

      if (typeof isVisible !== 'boolean') {
        const response: ApiResponse = {
          success: false,
          message: 'Параметр isVisible должен быть boolean'
        };
        res.status(400).json(response);
        return;
      }

      // Находим и обновляем блок
      const blockIndex = currentBlocksConfig.blocks.findIndex(block => block.id === blockId);

      if (blockIndex === -1) {
        const response: ApiResponse = {
          success: false,
          message: `Блок с id "${blockId}" не найден`
        };
        res.status(404).json(response);
        return;
      }

      if (currentBlocksConfig.blocks[blockIndex]) {
        currentBlocksConfig.blocks[blockIndex].isVisible = isVisible;
      }

      const response: ApiResponse<HomeBlocksConfig> = {
        success: true,
        message: `Блок "${blockId}" ${isVisible ? 'включен' : 'отключен'}`,
        data: currentBlocksConfig
      };

      res.json(response);
    } catch (error) {
      console.error('Error toggling block:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Ошибка при изменении видимости блока'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Изменить порядок блоков
   */
  async updateBlockOrder(req: Request, res: Response): Promise<void> {
    try {
      const { blockId } = req.params;
      const { newOrder } = req.body;

      if (typeof newOrder !== 'number' || newOrder < 1) {
        const response: ApiResponse = {
          success: false,
          message: 'Параметр newOrder должен быть положительным числом'
        };
        res.status(400).json(response);
        return;
      }

      // Находим блок
      const blockIndex = currentBlocksConfig.blocks.findIndex(block => block.id === blockId);

      if (blockIndex === -1) {
        const response: ApiResponse = {
          success: false,
          message: `Блок с id "${blockId}" не найден`
        };
        res.status(404).json(response);
        return;
      }

      // Обновляем порядок
      if (currentBlocksConfig.blocks[blockIndex]) {
        currentBlocksConfig.blocks[blockIndex].order = newOrder;
      }

      // Сортируем блоки по порядку
      currentBlocksConfig.blocks.sort((a, b) => a.order - b.order);

      const response: ApiResponse<HomeBlocksConfig> = {
        success: true,
        message: `Порядок блока "${blockId}" обновлен`,
        data: currentBlocksConfig
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating block order:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Ошибка при изменении порядка блока'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Сбросить конфигурацию к значениям по умолчанию
   */
  async resetToDefault(req: Request, res: Response): Promise<void> {
    try {
      currentBlocksConfig = { ...defaultBlocksConfig };

      const response: ApiResponse<HomeBlocksConfig> = {
        success: true,
        message: 'Конфигурация сброшена к значениям по умолчанию',
        data: currentBlocksConfig
      };

      res.json(response);
    } catch (error) {
      console.error('Error resetting blocks config:', error);
      const response: ApiResponse = {
        success: false,
        message: 'Ошибка при сбросе конфигурации'
      };
      res.status(500).json(response);
    }
  }
}

export default new HomeBlocksController();
