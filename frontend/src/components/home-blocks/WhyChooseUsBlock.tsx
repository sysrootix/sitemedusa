import { motion } from 'framer-motion'
import { Shield, Award, Zap } from 'lucide-react'

const WhyChooseUsBlock = () => {
  const features = [
    {
      icon: Shield,
      title: 'Качество',
      description: 'Только оригинальная продукция от проверенных брендов',
      gradient: 'from-purple-500 to-purple-700'
    },
    {
      icon: Award,
      title: 'Гарантия',
      description: 'Официальная гарантия на все устройства',
      gradient: 'from-purple-600 to-purple-800'
    },
    {
      icon: Zap,
      title: 'Инновации',
      description: 'Новейшие технологии и тренды вейпинга',
      gradient: 'from-gray-600 to-gray-800'
    }
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-transparent">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-10 lg:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4 sm:mb-6 text-gray-900 dark:text-white">
            Почему выбирают <span className="text-purple-600 dark:text-purple-400">нас</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4 sm:px-0">
            Мы предлагаем не просто продукты, а комплексный опыт премиального вейпинга
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[200px] sm:min-h-[220px]"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4 sm:mb-5">
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-gray-800 dark:text-gray-200" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-2 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">{feature.description}</p>
              </div>

              {/* No extra hover backgrounds for minimalism */}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhyChooseUsBlock
