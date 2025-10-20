import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Gift, Zap, Sparkles, Gamepad2, Cake, Share, Star, Crown, ArrowRight, Users, TrendingUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRef } from 'react'

const BonusSystem = () => {
  const { isAuthenticated } = useAuth()


  const heroRef = useRef(null)
  const statsRef = useRef(null)
  const levelsRef = useRef(null)
  const benefitsRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -50])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

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
      title: '⚡ Мгновенное начисление',
      description: 'Бонусы начисляются сразу после оплаты и готовы к использованию.'
    },
    {
      icon: Sparkles,
      title: '🎁 Бонусные подарки',
      description: 'Специальные предложения и подарки за достижение новых уровней.'
    },
    {
      icon: Gamepad2,
      title: '🎮 Игровые бонусы',
      description: 'Участвуйте в играх и конкурсах за дополнительные бонусы.'
    },
    {
      icon: Cake,
      title: '🎂 День рождения',
      description: 'Двойные бонусы в ваш день рождения и персональные поздравления.'
    },
    {
      icon: Share,
      title: '📢 Реферальная программа',
      description: 'Приглашайте друзей и получайте бонусы за каждую их покупку.'
    }
  ]

  const stats = [
    { icon: Users, value: '40,000+', label: 'Участников программы' },
    { icon: TrendingUp, value: '₽50M+', label: 'Экономии участникам' },
    { icon: Star, value: '4.9/5', label: 'Рейтинг удовлетворенности' },
    { icon: Crown, value: '10,000+', label: 'VIP-клиентов' }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative overflow-hidden" style={{ position: 'relative' }}>
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-200/20 to-pink-200/20 dark:from-purple-900/10 dark:to-pink-900/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/20 to-purple-200/20 dark:from-blue-900/10 dark:to-purple-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="relative border-b border-gray-200/50 dark:border-gray-800/50" style={{ position: 'relative' }}>
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="container-custom py-20 md:py-32"
        >
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center max-w-5xl mx-auto relative"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-100/80 to-pink-100/80 dark:from-purple-900/40 dark:to-pink-900/40 backdrop-blur-sm border border-white/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold mb-8 shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-3 animate-pulse" />
              Бонусная программа MEDUSA
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 80 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 text-gray-900 dark:text-white leading-tight"
            >
              Экономьте до{' '}
              <motion.span
                initial={{ backgroundPosition: "0% 50%" }}
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent bg-[length:200%_200%]"
              >
                10%
              </motion.span>{' '}
              на каждой покупке
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-6 leading-relaxed max-w-3xl mx-auto"
            >
              Присоединяйтесь к тысячам довольных клиентов и начните экономить на покупках прямо сейчас.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto"
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 2 }}
                className="text-purple-600 dark:text-purple-400 font-semibold"
              >
                Чем больше покупаете - тем больше экономите!
              </motion.span>
            </motion.p>

            {!isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex justify-center"
              >
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <a
                    href="https://webapp.mda-platform.top?utm_source=newsite&utm_medium=page&utm_campaign=bonuska"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Sparkles className="w-5 h-5 mr-3" />
                    Зарегистрироваться бесплатно
                    <ArrowRight className="w-5 h-5 ml-3" />
                  </a>
                </motion.div>
              </motion.div>
            )}

            {isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex justify-center"
              >
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Link
                    to="/profile"
                    className="inline-flex items-center bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl"
                  >
                    👤 Мой профиль и бонусы
                    <ArrowRight className="w-5 h-5 ml-3" />
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 border-b border-gray-200/50 dark:border-gray-800/50 relative">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.15, type: "spring", stiffness: 100 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.05 }}
                className="group text-center"
              >
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100/80 to-pink-100/80 dark:from-purple-900/40 dark:to-pink-900/40 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-white/20 group-hover:shadow-2xl group-hover:shadow-purple-500/10 transition-all duration-500">
                    <stat.icon className="w-10 h-10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-200/50 to-pink-200/50 dark:from-purple-800/30 dark:to-pink-800/30 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.15 + 0.3, type: "spring", stiffness: 200 }}
                  className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2"
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Loyalty Levels */}
      <section ref={levelsRef} className="py-24 border-b border-gray-200/50 dark:border-gray-800/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-50/30 to-transparent dark:via-purple-900/5"></div>
        <div className="container-custom relative">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent"
            >
              Уровни лояльности
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed"
            >
              Чем больше вы покупаете, тем выше ваш статус и процент кэшбека
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {loyaltyLevels.map((level, index) => (
              <motion.div
                key={level.level}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.15, type: "spring", stiffness: 100 }}
                viewport={{ once: true }}
                whileHover={{ y: -12, scale: 1.02 }}
                className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-3xl p-8 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500"
              >
                {/* Animated background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${level.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                {/* Floating elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-12 -mt-12"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white/5 to-transparent rounded-full -ml-8 -mb-8"></div>

                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-700/80 dark:to-gray-600/60 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-white/30 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                    <img
                      src={level.iconUrl}
                      alt={`Иконка ${level.level} уровня`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white text-center group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                    {level.level}
                  </h3>

                  <div className="text-center mb-6">
                    <motion.span
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.6, delay: index * 0.15 + 0.3, type: "spring", stiffness: 200 }}
                      className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent"
                    >
                      {level.percentage}
                    </motion.span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2 font-medium">кэшбек</span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed">
                    {level.description}
                  </p>

                  <div className="text-xs text-gray-500 dark:text-gray-500 text-center font-medium bg-gray-50/50 dark:bg-gray-700/30 rounded-full px-3 py-2">
                    от {level.threshold}
                  </div>
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-200/0 via-purple-200/20 to-pink-200/0 dark:from-purple-800/0 dark:via-purple-800/10 dark:to-pink-800/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section ref={benefitsRef} className="py-24 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent"
            >
              Преимущества программы
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed"
            >
              Мы сделали все, чтобы участие в программе было максимально выгодным и удобным
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.15, type: "spring", stiffness: 100 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-3xl p-8 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 overflow-hidden"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Floating elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-10 -mt-10"></div>

                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-100/80 to-pink-100/80 dark:from-purple-900/40 dark:to-pink-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-white/30 group-hover:scale-110 transition-transform duration-500">
                    <benefit.icon className="w-7 h-7 text-purple-600 dark:text-purple-400 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                    {benefit.description}
                  </p>
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-200/0 via-purple-200/10 to-pink-200/0 dark:from-purple-800/0 dark:via-purple-800/5 dark:to-pink-800/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default BonusSystem
