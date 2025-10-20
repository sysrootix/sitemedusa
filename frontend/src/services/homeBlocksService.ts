import apiService from './api'
import { HomeBlocksConfig, HomeBlock } from '@/components/home-blocks/types'

// Сервис для работы с блоками главной страницы
class HomeBlocksService {
  // Получить конфигурацию блоков
  async getBlocksConfig(): Promise<HomeBlocksConfig> {
    try {
      const response = await apiService.getHomeBlocksConfig()
      return {
        blocks: response.blocks || this.getDefaultConfig().blocks
      }
    } catch (error) {
      console.warn('Failed to fetch blocks config, using default:', error)
      // Возвращаем конфигурацию по умолчанию, если API недоступен
      return this.getDefaultConfig()
    }
  }

  // Обновить конфигурацию блоков
  async updateBlocksConfig(config: HomeBlocksConfig): Promise<HomeBlocksConfig> {
    try {
      const response = await apiService.updateHomeBlocksConfig(config)
      return {
        blocks: response.blocks
      }
    } catch (error) {
      console.error('Failed to update blocks config:', error)
      throw error
    }
  }

  // Получить конфигурацию по умолчанию
  private getDefaultConfig(): HomeBlocksConfig {
    return {
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
    }
  }

  // Включить/отключить блок
  async toggleBlockVisibility(blockId: string, isVisible: boolean): Promise<HomeBlocksConfig> {
    const currentConfig = await this.getBlocksConfig()
    const updatedBlocks = currentConfig.blocks.map(block =>
      block.id === blockId ? { ...block, isVisible } : block
    )

    return this.updateBlocksConfig({ blocks: updatedBlocks })
  }

  // Изменить порядок блоков
  async updateBlockOrder(blockId: string, newOrder: number): Promise<HomeBlocksConfig> {
    const currentConfig = await this.getBlocksConfig()
    const updatedBlocks = currentConfig.blocks.map(block =>
      block.id === blockId ? { ...block, order: newOrder } : block
    ).sort((a, b) => a.order - b.order)

    return this.updateBlocksConfig({ blocks: updatedBlocks })
  }

  // Проверить, есть ли блок в конфигурации
  hasBlock(blockId: string, config: HomeBlocksConfig): boolean {
    return config.blocks.some(block => block.id === blockId)
  }

  // Получить блок по ID
  getBlock(blockId: string, config: HomeBlocksConfig): HomeBlock | undefined {
    return config.blocks.find(block => block.id === blockId)
  }
}

export default new HomeBlocksService()
