import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, User, ArrowRight, Clock } from 'lucide-react'
import api from '@/services/api'

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author?: string;
  published_at: string;
  updated_at: string;
  created_at?: string;
  category?: string;
  reading_time?: number;
  tags?: string[];
  image_url?: string;
}

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchArticles = async () => {
      try {
        setLoading(true)
        const { articles } = await api.getArticles({ page: 1, limit: 12 })
        if (isMounted) setArticles(articles as Article[])
      } catch (e: unknown) {
        if (isMounted) setError(api.handleApiError(e))
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchArticles()
    return () => { isMounted = false }
  }, [])

  const categories = ['Все']

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600 dark:text-red-400 font-medium">{error}</div>
      </div>
    )
  }

  if (loading && articles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Загрузка статей...</div>
      </div>
    )
  }

  if (!loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/10 transition-colors duration-300 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">Статей пока что нет</h2>
          <p className="text-gray-600 dark:text-gray-300">Загляните позже — мы скоро добавим материалы.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/10 transition-colors duration-300">
      <div className="container-custom py-12 lg:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16 lg:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/50 rounded-full text-purple-700 dark:text-purple-300 text-sm font-semibold mb-6 shadow-sm"
          >
            ✨ Экспертные материалы
          </motion.div>
          <h1 className="text-display mb-6 text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 via-purple-800 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent">
            Блог и статьи
          </h1>
          <p className="text-body text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Погрузитесь в мир экспертных знаний о вейпинге. Наши специалисты делятся полезными советами, 
            обзорами новинок и профессиональными рекомендациями для всех уровней опыта.
          </p>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16"
        >
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category, index) => (
                <motion.button
                  key={category}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                    index === 0
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-600/25 hover:shadow-xl hover:shadow-purple-600/30'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 border-2 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 shadow-sm hover:shadow-md'
                  }`}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Featured Article */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mb-20 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 dark:from-purple-700 dark:via-purple-800 dark:to-purple-900 rounded-3xl overflow-hidden shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:-translate-y-1">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            
            <div className="relative flex flex-col lg:flex-row">
              <div className="lg:w-3/5 p-8 lg:p-12 xl:p-16">
                <div className="flex items-center flex-wrap gap-3 mb-6">
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold border border-white/20"
                  >
                    🔥 Рекомендуем
                  </motion.span>
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold border border-white/20"
                  >
                    {articles[0]?.category || 'Категория'}
                  </motion.span>
                </div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-6 leading-tight text-white"
                >
                  {articles[0]?.title || ''}
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                  className="text-purple-100 mb-8 text-lg xl:text-xl leading-relaxed"
                >
                  {articles[0]?.excerpt || ''}
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  className="flex items-center flex-wrap gap-6 mb-8 text-purple-200"
                >
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span className="font-medium">{articles[0]?.author || 'Автор'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>{articles[0]?.published_at ? new Date(articles[0]?.published_at).toLocaleDateString('ru-RU') : articles[0]?.created_at ? new Date(articles[0]?.created_at).toLocaleDateString('ru-RU') : ''}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>{articles[0]?.reading_time ? `${articles[0].reading_time} мин` : ''}</span>
                  </div>
                </motion.div>
                
                <motion.button 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-purple-700 hover:bg-purple-50 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 inline-flex items-center group shadow-xl hover:shadow-2xl"
                >
                  Читать статью
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </motion.button>
              </div>
              
              <div className="lg:w-2/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="h-64 lg:h-full flex items-center justify-center p-8">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="relative"
                  >
                    <div className="w-48 h-32 lg:w-64 lg:h-40 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/30 shadow-2xl">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/30 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">📖</span>
                        </div>
                        <span className="text-white text-lg font-bold">Featured Article</span>
                      </div>
                    </div>
                    
                    {/* Floating elements */}
                    <motion.div
                      animate={{ y: [-8, 8, -8] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute -top-4 -right-4 w-8 h-8 bg-white/20 rounded-full border border-white/30"
                    ></motion.div>
                    <motion.div
                      animate={{ y: [8, -8, 8] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                      className="absolute -bottom-4 -left-4 w-6 h-6 bg-white/20 rounded-full border border-white/30"
                    ></motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {articles.slice(1).map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 + index * 0.1, ease: "easeOut" }}
              whileHover={{ y: -8 }}
              className="group cursor-pointer"
            >
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-300/50 dark:hover:border-purple-500/50">
                {/* Image Section */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-700 dark:to-gray-600 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-transparent to-purple-600/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                      className="w-24 h-24 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-2xl flex items-center justify-center shadow-2xl"
                    >
                      <span className="text-white font-bold text-xl">#{article.id}</span>
                    </motion.div>
                  </div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                      className="bg-white/90 backdrop-blur-sm text-purple-700 px-4 py-2 rounded-2xl text-sm font-bold shadow-lg border border-purple-200/50"
                    >
                      {article?.category || ''}
                    </motion.span>
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                {/* Content Section */}
                <div className="p-8">
                  <motion.h3 
                    className="text-xl lg:text-2xl font-bold mb-4 leading-tight text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300"
                  >
                    {article?.title}
                  </motion.h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed line-clamp-3">
                    {article?.excerpt}
                  </p>
                  
                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-medium">{article?.author || 'Автор'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span>{article?.reading_time ? `${article.reading_time} мин` : ''}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{article?.published_at ? new Date(article?.published_at).toLocaleDateString('ru-RU') : article?.created_at ? new Date(article?.created_at).toLocaleDateString('ru-RU') : ''}</span>
                    <motion.button 
                      whileHover={{ x: 4 }}
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-bold text-sm inline-flex items-center group bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all duration-300"
                    >
                      Читать статью
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </motion.button>
                  </div>
                </div>
                
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600/10 via-transparent to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Load More */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16 lg:mt-20"
        >
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-10 py-4 rounded-2xl font-bold text-lg border-2 border-purple-600/30 dark:border-purple-500/30 hover:border-purple-600 dark:hover:border-purple-400 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 inline-flex items-center">
              Загрузить еще статьи
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="ml-3 w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity duration-300"
              >
                🔄
              </motion.div>
            </span>
          </motion.button>
          
          {/* Decorative elements */}
          <div className="flex items-center justify-center mt-8 space-x-2">
            <div className="w-2 h-2 bg-purple-300 dark:bg-purple-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-400 dark:bg-purple-500 rounded-full animate-pulse delay-100"></div>
            <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-pulse delay-200"></div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Articles
