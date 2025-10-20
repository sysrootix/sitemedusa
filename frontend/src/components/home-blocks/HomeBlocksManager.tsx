import { lazy, Suspense } from 'react'
import { HomeBlockType, HomeBlocksConfig } from './types'

// Простой разделитель между блоками (минимализм)
const BlockDivider = () => <div className="py-10" />

// Lazy loading компонентов для оптимизации
const HeroBlock = lazy(() => import('./HeroBlock'))
const WhyChooseUsBlock = lazy(() => import('./WhyChooseUsBlock'))
const PopularProductsBlock = lazy(() => import('./PopularProductsBlock'))
const BonusProgramBlock = lazy(() => import('./BonusProgramBlock'))
const CtaBlock = lazy(() => import('./CtaBlock'))

// Компонент-загрузчик для Suspense
const BlockLoader = () => (
  <div className="flex items-center justify-center py-16">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 dark:border-white"></div>
  </div>
)

// Маппинг типов блоков к компонентам
const blockComponents: Record<HomeBlockType, React.ComponentType> = {
  hero: HeroBlock,
  'why-choose-us': WhyChooseUsBlock,
  'popular-products': PopularProductsBlock,
  'bonus-program': BonusProgramBlock,
  cta: CtaBlock,
}

interface HomeBlocksManagerProps {
  config: HomeBlocksConfig
}

const HomeBlocksManager = ({ config }: HomeBlocksManagerProps) => {
  // Сортируем блоки по порядку и фильтруем видимые
  const visibleBlocks = config.blocks
    .filter(block => block.isVisible)
    .sort((a, b) => a.order - b.order)

  return (
    <div>
      <Suspense fallback={<BlockLoader />}>
        {visibleBlocks.map((block, index) => {
          const BlockComponent = blockComponents[block.id]

          if (!BlockComponent) {
            console.warn(`Block component not found for type: ${block.id}`)
            return null
          }

          return (
            <div key={block.id} className="container-custom">
              {index > 0 && <BlockDivider />}
              <BlockComponent />
            </div>
          )
        })}
      </Suspense>
    </div>
  )
}

export default HomeBlocksManager
