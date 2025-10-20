import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import homeBlocksService from '@/services/homeBlocksService'
import { HomeBlocksConfig } from '@/components/home-blocks/types'

interface HomeBlocksContextType {
  config: HomeBlocksConfig | null
  isLoading: boolean
  error: string | null
  refreshConfig: () => Promise<void>
  toggleBlock: (blockId: string, isVisible: boolean) => Promise<void>
  updateBlockOrder: (blockId: string, newOrder: number) => Promise<void>
  isBlockVisible: (blockId: string) => boolean
}

const HomeBlocksContext = createContext<HomeBlocksContextType | undefined>(undefined)

interface HomeBlocksProviderProps {
  children: ReactNode
}

export const HomeBlocksProvider = ({ children }: HomeBlocksProviderProps) => {
  const [config, setConfig] = useState<HomeBlocksConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Загрузка конфигурации при монтировании
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      const blocksConfig = await homeBlocksService.getBlocksConfig()
      setConfig(blocksConfig)
    } catch (err) {
      console.error('Failed to load home blocks config:', err)
      setError('Не удалось загрузить конфигурацию блоков')
      // Используем конфигурацию по умолчанию при ошибке
      const defaultConfig = await homeBlocksService.getBlocksConfig()
      setConfig(defaultConfig)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshConfig = async (): Promise<void> => {
    await loadConfig()
  }

  const toggleBlock = async (blockId: string, isVisible: boolean): Promise<void> => {
    if (!config) return

    try {
      setIsLoading(true)
      const updatedConfig = await homeBlocksService.toggleBlockVisibility(blockId, isVisible)
      setConfig(updatedConfig)
    } catch (err) {
      console.error('Failed to toggle block visibility:', err)
      setError('Не удалось изменить видимость блока')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateBlockOrder = async (blockId: string, newOrder: number): Promise<void> => {
    if (!config) return

    try {
      setIsLoading(true)
      const updatedConfig = await homeBlocksService.updateBlockOrder(blockId, newOrder)
      setConfig(updatedConfig)
    } catch (err) {
      console.error('Failed to update block order:', err)
      setError('Не удалось изменить порядок блоков')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const isBlockVisible = (blockId: string): boolean => {
    if (!config) return false
    const block = homeBlocksService.getBlock(blockId, config)
    return block?.isVisible ?? false
  }

  const value: HomeBlocksContextType = {
    config,
    isLoading,
    error,
    refreshConfig,
    toggleBlock,
    updateBlockOrder,
    isBlockVisible
  }

  return (
    <HomeBlocksContext.Provider value={value}>
      {children}
    </HomeBlocksContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useHomeBlocks = (): HomeBlocksContextType => {
  const context = useContext(HomeBlocksContext)
  if (context === undefined) {
    throw new Error('useHomeBlocks must be used within a HomeBlocksProvider')
  }
  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export default useHomeBlocks
