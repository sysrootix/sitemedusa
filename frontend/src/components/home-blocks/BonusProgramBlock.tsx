import { motion } from 'framer-motion'
import { Gift, Zap, Sparkles, Gamepad2, Cake, Share, Bell } from 'lucide-react'

const BonusProgramBlock = () => {
  const loyaltyLevels = [
    {
      level: 'Бронзовый',
      percentage: '3%',
      description: '🚀 Начните экономить прямо сейчас! Каждый рубль возвращается бонусами.',
      threshold: '0 ₽',
      iconUrl: '/assets/icons/status/bronze.png',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20'
    },
    {
      level: 'Серебряный',
      percentage: '5%',
      description: '💎 Удваивайте выгоду! Экономьте 5% и получайте статус VIP-покупателя.',
      threshold: '10 000 ₽',
      iconUrl: '/assets/icons/status/silver.png',
      color: 'from-gray-400 to-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20'
    },
    {
      level: 'Золотой',
      percentage: '7%',
      description: '🏆 Элита клуба! 7% кэшбек + приоритетное обслуживание для наших лучших клиентов.',
      threshold: '20 000 ₽',
      iconUrl: '/assets/icons/status/gold.png',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      level: 'Платиновый',
      percentage: '10%',
      description: '👑 Максимум привилегий! 10% кэшбек для самых преданных клиентов MEDUSA.',
      threshold: '30 000 ₽',
      iconUrl: '/assets/icons/status/platinum.png',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ]

  const benefits = [
    {
      icon: Gift,
      title: '💰 Накопительная система',
      description: 'Чем больше покупаете - тем выше процент кэшбека! Автоматический рост статуса.'
    },
    {
      icon: Zap,
      title: '⚡ Гибкое списание',
      description: 'Оплачивайте до 100% стоимости товара бонусами. Экономьте на каждой покупке!'
    },
    {
      icon: Gamepad2,
      title: '🎰 Рулетка везения',
      description: '400 бонусов = шанс выиграть премиальные жидкости, гаджеты и мерч!'
    },
    {
      icon: Cake,
      title: '🎂 День рождения',
      description: '+300 бонусов в ваш день рождения! Празднуйте с выгодой в MEDUSA.'
    },
    {
      icon: Share,
      title: '👥 Приглашай друзей',
      description: 'Получайте бонусы за каждого приведенного друга. Пассивный доход!'
    },
    {
      icon: Bell,
      title: '🚨 Эксклюзивные акции',
      description: 'Первыми узнавайте о скидках и специальных предложениях только для участников!'
    }
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-transparent">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-10 lg:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4 sm:mb-6 text-gray-900 dark:text-white">
            Бонусная <span className="text-purple-600 dark:text-purple-400">программа</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-4 sm:mb-6 px-4 sm:px-0">
            💰 Экономьте до 10% с каждой покупки! Повышайте статус и получайте VIP-привилегии
          </p>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 100 }}
            className="inline-flex items-center justify-center gap-2 sm:gap-3 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-400"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.div>
            <span className="text-sm sm:text-base">🎁 За регистрацию +100 баллов</span>
          </motion.div>
        </motion.div>

        {/* Loyalty Levels */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-12 sm:mb-16 lg:mb-20"
        >
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-10 lg:mb-12 text-gray-900 dark:text-white">
            Уровни лояльности и привилегии
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {loyaltyLevels.map((level, index) => (
              <motion.div
                key={level.level}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`group relative bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[180px] sm:min-h-[200px]`}
              >
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 overflow-hidden">
                    <img
                      src={level.iconUrl}
                      alt={`Иконка ${level.level} уровня`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h4 className="text-base sm:text-lg font-semibold mb-1 text-gray-900 dark:text-white">
                    {level.level}
                  </h4>

                  <div className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold text-sm sm:text-base md:text-lg rounded-xl mb-2 sm:mb-3">{level.percentage}</div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">
                    от {level.threshold}
                  </p>

                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-xs sm:text-sm">
                    {level.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12 sm:mb-16"
        >
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-10 lg:mb-12 text-gray-900 dark:text-white">
            Преимущества участия в программе
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[120px] sm:min-h-[140px]"
              >
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                      <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 dark:text-gray-200" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h4 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                      {benefit.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs sm:text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}

export default BonusProgramBlock
