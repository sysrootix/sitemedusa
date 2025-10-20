import { motion } from 'framer-motion'
import { ArrowRight, Star, Truck, Award, Zap, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui'
import homeVideo from '@/assets/icons/social/home.mp4'
import MiniGame from '@/components/MiniGame'

const HeroBlock = () => {
  const yearsOnMarket = new Date().getFullYear() - 2017

  const stats = [
    { icon: Heart, value: '99%', label: 'Положительных отзывов' },
    { icon: Truck, value: '24/7', label: 'Поддержка клиентов' },
    { icon: Award, value: yearsOnMarket.toString(), label: 'Лет на рынке' }
  ]

  return (
    <>
      <section className="relative min-h-screen flex items-center bg-transparent text-gray-900 dark:text-white overflow-hidden w-full">

      <div className="relative z-10 w-full">
        <div className="flex flex-col gap-6 sm:gap-8 lg:gap-12 items-center px-4 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto">
          {/* Header Content */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4 sm:space-y-6 lg:space-y-8 text-center w-full max-w-4xl"
          >
            <div className="space-y-4 sm:space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-xs sm:text-sm font-medium"
              >
                ✨ Премиум вейп-шоп в Хабаровске
              </motion.div>

              <h1
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight max-w-[min(100%,40rem)] text-center mx-auto"
              >
                Добро пожаловать в{' '}
                <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent dark:from-purple-400 dark:to-purple-500">
                  Medusa
                </span>
              </h1>
            </div>
          </motion.div>

          {/* Description and Video */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center w-full">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-4 sm:space-y-6 lg:space-y-8 order-2 lg:order-1"
            >
              <div className="space-y-3 sm:space-y-4 max-w-2xl">
                <p
                  className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed"
                  style={{ textWrap: 'balance' as any }}
                >
                  Откройте для себя мир премиального вейпинга.
                </p>

                <p
                  className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed"
                  style={{ textWrap: 'balance' as any }}
                >
                  Качественные устройства, эксклюзивные жидкости и профессиональный сервис — без компромиссов.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Link to="/catalog">
                  <Button
                    variant="primary"
                    size="lg"
                    rightIcon={<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg w-full sm:w-auto min-h-[48px]"
                    aria-label="Смотреть каталог"
                  >
                    Смотреть каталог
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Link to="/about">
                  <Button
                    variant="outline"
                    size="lg"
                    className="group relative border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent transition-colors duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 w-full sm:w-auto min-h-[48px]"
                    aria-label="Узнать больше"
                  >
                    <span className="relative z-10">Узнать больше</span>
                  </Button>
                </Link>
              </motion.div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 pt-6 sm:pt-8 md:pt-12 border-t border-gray-200 dark:border-white/10 max-w-md md:max-w-none">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 + index * 0.15 }}
                    className="text-center"
                  >
                    <motion.div
                      transition={{ duration: 0.3 }}
                      className="group w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3"
                      aria-hidden
                    >
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-purple-600 dark:text-purple-400" />
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.8 + index * 0.1, type: "spring", stiffness: 100 }}
                      className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 text-gray-900 dark:text-white"
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium leading-tight">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Hero Image/Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative order-1 lg:order-2"
            >
              <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px] max-w-md mx-auto lg:max-w-none">
                {/* Main device mockup */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-900 rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-900/50 transform rotate-2 sm:rotate-3 hover:rotate-6 transition-transform duration-500">
                  <div className="absolute inset-3 sm:inset-4 bg-gradient-to-br from-white to-gray-100 rounded-xl sm:rounded-2xl overflow-hidden">
                    <video
                      src={homeVideo}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Floating elements - скрываем на маленьких экранах для лучшей производительности */}
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 flex items-center justify-center"
                >
                  <Star className="w-5 h-5 sm:w-6 sm:w-6 md:w-8 md:h-8 text-purple-400" />
                </motion.div>

                <motion.div
                  animate={{ y: [10, -10, 10] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-purple-600/20 backdrop-blur-sm rounded-lg sm:rounded-xl border border-purple-500/30 flex items-center justify-center"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-300" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>

    {/* Mini Game */}
    <div className="w-full max-w-4xl mx-auto mt-16 px-4 sm:px-6 lg:px-8">
      <MiniGame />
    </div>
    </>
  )
}

export default HeroBlock
