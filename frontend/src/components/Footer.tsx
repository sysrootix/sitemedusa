import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { telegram, vk, instagram, tiktok, youtube } from '@/assets/icons/social'

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900 text-white relative overflow-hidden block-transition">
      {/* Декоративные элементы */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container-custom py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            <Link 
              to="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img
                  src="/assets/icons/ico.png"
                  alt="Medusa Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <span className="text-2xl font-bold font-display">Medusa</span>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed">
              Современный вейп-магазин в Хабаровске. Только оригинальная продукция,
              профессиональное обслуживание и выгодная бонусная программа.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://t.me/+991rXYux6AFjYzYy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors duration-200 p-2 hover:bg-blue-600/20 rounded-lg"
                title="Telegram"
              >
                <img src={telegram} alt="Telegram" className="w-10 h-10" />
              </a>
              <a
                href="https://vk.com/medusa27"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-500 transition-colors duration-200 p-2 hover:bg-blue-500/20 rounded-lg"
                title="VK"
              >
                <img src={vk} alt="VK" className="w-10 h-10" />
              </a>
              <a
                href="https://www.instagram.com/mda.mda.khv?igsh=dzF4Nm9lcDRuOXZ1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-400 transition-colors duration-200 p-2 hover:bg-pink-600/20 rounded-lg"
                title="Instagram"
              >
                <img src={instagram} alt="Instagram" className="w-10 h-10" />
              </a>
              <a
                href="https://vt.tiktok.com/ZSDA7BACy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black transition-colors duration-200 p-2 hover:bg-gray-600/20 rounded-lg"
                title="TikTok"
              >
                <img src={tiktok} alt="TikTok" className="w-10 h-10" />
              </a>
              <a
                href="https://www.youtube.com/@medusakhv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-2 hover:bg-red-600/20 rounded-lg"
                title="YouTube"
              >
                <img src={youtube} alt="YouTube" className="w-10 h-10" />
              </a>
            </div>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Навигация</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Главная
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Каталог
                </Link>
              </li>
              <li>
                <Link to="/shops" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Магазины
                </Link>
              </li>
              <li>
                <Link to="/articles" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Статьи
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors duration-200">
                  О нас
                </Link>
              </li>
              <li>
                <Link to="/vacancies" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Вакансии
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Контакты
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Личный кабинет
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Категории</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Одноразовые
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Устройства
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Жидкости
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Аксессуары
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Контакты</h3>
            <div className="space-y-3">
              <a
                href="tel:+74212666060"
                className="flex items-center space-x-3 hover:text-white transition-colors duration-200"
              >
                <Phone className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">+7 (4212) 66-60-60</span>
              </a>
              <a
                href="mailto:medusa666060@mail.ru"
                className="flex items-center space-x-3 hover:text-white transition-colors duration-200"
              >
                <Mail className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">medusa666060@mail.ru</span>
              </a>
              <a
                href="https://t.me/+991rXYux6AFjYzYy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 hover:text-white transition-colors duration-200"
              >
                <img src={telegram} alt="Telegram" className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">Telegram чат</span>
              </a>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-purple-400 mt-0.5" />
                <span className="text-gray-300 leading-relaxed">40 магазинов<br/>по всему краю</span>
              </div>
            </div>
            <div className="pt-4 space-y-2">
              <p className="text-xs text-gray-400">
                Режим работы: ежедневно
              </p>
              <p className="text-xs text-gray-400">
                Гарантия: 14 дней на многоразовые устройства
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="border-t border-gray-600/50 pt-8 mt-12"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              © {new Date().getFullYear()} Medusa. Все права защищены.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                Политика конфиденциальности
              </a>
              <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                Условия использования
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
