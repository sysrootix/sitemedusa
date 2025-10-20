import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui'
import { QrCode, Smartphone } from 'lucide-react'

const CtaBlock = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-transparent text-gray-900 dark:text-white">

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Не упустите возможность</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-4 sm:mb-6">+100 баллов за регистрацию. Кэшбек с каждой покупки.</p>

            <div className="space-y-4 sm:space-y-6">
              {/* QR Code Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                  <h3 className="text-base sm:text-lg font-semibold">Быстрая регистрация</h3>
                </div>
                <p className="text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">
                  📱 Отсканируйте QR-код и получите <strong className="text-purple-400">+100 баллов</strong> сразу!
                </p>
                <div className="bg-white p-3 sm:p-4 rounded-xl inline-block">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('https://webapp.mda-platform.top?utm_source=newsite&utm_medium=qr&utm_campaign=home')}`}
                    alt="QR код для регистрации в бонусной программе"
                    className="w-24 h-24 sm:w-32 sm:h-32"
                  />
                </div>
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <a
                  href="https://webapp.mda-platform.top?utm_source=newsite&utm_medium=button&utm_campaign=home"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="primary" size="lg" className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90 w-full sm:w-auto min-h-[48px] px-6 sm:px-8 py-3 sm:py-4">
                    <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Получить 100 баллов
                  </Button>
                </a>
                <Link to="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/20 text-white hover:bg-white hover:text-gray-900 w-full sm:w-auto min-h-[48px] px-6 sm:px-8 py-3 sm:py-4"
                  >
                    Связаться с нами
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Visual/Stats */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center lg:text-left"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/10">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">🎯 Ваши преимущества</h3>
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-1 sm:mb-2">💰 3-10%</div>
                  <div className="text-xs sm:text-sm text-gray-300">Кэшбек за каждую покупку</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-1 sm:mb-2">🎁 +100₽</div>
                  <div className="text-xs sm:text-sm text-gray-300">Бесплатно за регистрацию!</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-purple-400 mb-1 sm:mb-2">🎰</div>
                  <div className="text-xs sm:text-sm text-gray-300">Рулетка с призами</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-1 sm:mb-2">🎂 +300₽</div>
                  <div className="text-xs sm:text-sm text-gray-300">В день рождения</div>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20">
                <p className="text-center text-purple-300 font-semibold text-sm sm:text-base">
                  🚀 Регистрируйтесь сейчас и начните экономить!
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default CtaBlock
