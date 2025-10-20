import { useHomeBlocks } from '@/hooks/useHomeBlocks'
import HomeBlocksManager from '@/components/home-blocks/HomeBlocksManager'

const Home = () => {
  const { config, isLoading, error } = useHomeBlocks()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  if (error) {
    console.warn('Home blocks error:', error)
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-300">Не удалось загрузить конфигурацию страницы</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container-custom py-0">
        <HomeBlocksManager config={config} />
      </div>
    </div>
  )
}

export default Home