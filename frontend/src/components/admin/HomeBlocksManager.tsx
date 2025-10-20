import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowUp, ArrowDown, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/shared/ui'
import { useHomeBlocks } from '@/hooks/useHomeBlocks'
import { HomeBlock } from '@/components/home-blocks/types'

const HomeBlocksManager = () => {
  const { config, isLoading, error, toggleBlock, updateBlockOrder, refreshConfig } = useHomeBlocks()
  const [localConfig, setLocalConfig] = useState<HomeBlock[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (config) {
      setLocalConfig([...config.blocks])
      setHasChanges(false)
    }
  }, [config])

  const handleToggleBlock = async (blockId: string, isVisible: boolean) => {
    try {
      await toggleBlock(blockId, isVisible)
      setHasChanges(true)
    } catch (err) {
      console.error('Failed to toggle block:', err)
    }
  }

  const handleMoveBlock = async (blockId: string, direction: 'up' | 'down') => {
    const blockIndex = localConfig.findIndex(block => block.id === blockId)
    if (blockIndex === -1) return

    const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1
    if (newIndex < 0 || newIndex >= localConfig.length) return

    // Меняем порядок локально
    const newConfig = [...localConfig]
    const [movedBlock] = newConfig.splice(blockIndex, 1)
    newConfig.splice(newIndex, 0, movedBlock)

    // Обновляем order для всех блоков
    newConfig.forEach((block, index) => {
      block.order = index + 1
    })

    setLocalConfig(newConfig)
    setHasChanges(true)

    // Обновляем на сервере
    try {
      await updateBlockOrder(blockId, newIndex + 1)
    } catch (err) {
      console.error('Failed to update block order:', err)
      // Восстанавливаем исходную конфигурацию при ошибке
      if (config) {
        setLocalConfig([...config.blocks])
      }
    }
  }

  const handleReset = async () => {
    try {
      await refreshConfig()
      setHasChanges(false)
    } catch (err) {
      console.error('Failed to reset config:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Ошибка загрузки конфигурации: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Управление блоками главной страницы
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Включите/отключите блоки и измените их порядок
          </p>
        </div>

        <div className="flex gap-3">
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Сбросить
            </Button>
          )}

          <Button
            variant="primary"
            onClick={refreshConfig}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Обновить
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {localConfig.map((block, index) => (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`bg-white dark:bg-gray-800 border rounded-lg p-6 shadow-sm ${
              block.isVisible
                ? 'border-gray-200 dark:border-gray-700'
                : 'border-gray-300 dark:border-gray-600 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {block.title}
                  </h3>
                  {!block.isVisible && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                      Отключен
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {block.description}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {/* Кнопки изменения порядка */}
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveBlock(block.id, 'up')}
                    disabled={index === 0}
                    className="p-1 h-6 w-6"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveBlock(block.id, 'down')}
                    disabled={index === localConfig.length - 1}
                    className="p-1 h-6 w-6"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </Button>
                </div>

                {/* Кнопка включения/отключения */}
                <Button
                  variant={block.isVisible ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handleToggleBlock(block.id, !block.isVisible)}
                  className="flex items-center gap-2 min-w-[100px]"
                >
                  {block.isVisible ? (
                    <>
                      <Eye className="w-4 h-4" />
                      Включен
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Отключен
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Порядок отображения */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Порядок: {block.order}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            У вас есть несохраненные изменения. Нажмите "Обновить" для применения изменений.
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default HomeBlocksManager
