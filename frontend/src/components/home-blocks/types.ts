export type HomeBlockType =
  | 'hero'
  | 'why-choose-us'
  | 'popular-products'
  | 'bonus-program'
  | 'cta'

export interface HomeBlock {
  id: HomeBlockType
  title: string
  description: string
  isVisible: boolean
  order: number
}

export interface HomeBlocksConfig {
  blocks: HomeBlock[]
}
