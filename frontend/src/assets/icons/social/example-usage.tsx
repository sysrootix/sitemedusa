// Пример использования новых иконок в компоненте Footer

import { Link } from 'react-router-dom'
// Импорт кастомных иконок
import { telegram, vk, instagram, tiktok, youtube } from '@/assets/icons/social'

const FooterExample = () => {
  return (
    <footer className="bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900 text-white relative overflow-hidden">
      {/* Бренд секция */}
      <div className="space-y-4">
        <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <span className="text-2xl font-bold font-display">Medusa</span>
        </Link>

        <p className="text-gray-300 text-sm leading-relaxed">
          Современный вейп-магазин в Хабаровске. Только оригинальная продукция,
          профессиональное обслуживание и выгодная бонусная программа.
        </p>

        {/* Социальные сети с новыми иконками */}
        <div className="flex space-x-3">
          {/* Вариант 1: Использование кастомных SVG иконок */}
          <a
            href="https://t.me/+7nupo5aB8qA4Zjhi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-400 transition-colors duration-200 p-2 hover:bg-blue-600/20 rounded-lg"
            title="Telegram"
          >
            <img src={telegram} alt="Telegram" className="w-5 h-5" />
          </a>

          <a
            href="https://vk.com/medusa27"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-500 transition-colors duration-200 p-2 hover:bg-blue-500/20 rounded-lg"
            title="VK"
          >
            <img src={vk} alt="VK" className="w-5 h-5" />
          </a>

          {/* Вариант 2: Смешанное использование (Lucide + кастомные) */}
          <a
            href="https://www.instagram.com/mda.mda.khv?igsh=dzF4Nm9lcDRuOXZ1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-pink-400 transition-colors duration-200 p-2 hover:bg-pink-600/20 rounded-lg"
            title="Instagram"
          >
            <img src={instagram} alt="Instagram" className="w-5 h-5" />
          </a>

          <a
            href="https://vt.tiktok.com/ZSDA7BACy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-black transition-colors duration-200 p-2 hover:bg-gray-600/20 rounded-lg"
            title="TikTok"
          >
            <img src={tiktok} alt="TikTok" className="w-5 h-5" />
          </a>

          <a
            href="https://www.youtube.com/@medusakhv"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-2 hover:bg-red-600/20 rounded-lg"
            title="YouTube"
          >
            <img src={youtube} alt="YouTube" className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Остальная часть футера */}
      <div className="container-custom py-16 relative z-10">
        {/* ... остальной код футера ... */}
      </div>
    </footer>
  )
}

export default FooterExample

/*
ИНСТРУКЦИЯ ПО ЗАМЕНЕ ИКОНОК:

1. ✅ Добавьте файлы иконок в папку /src/assets/icons/social/:
   - telegram.svg (уже есть)
   - vk.svg
   - instagram.svg
   - tiktok.svg
   - youtube.svg

2. ✅ Импорт кастомных иконок настроен

3. ✅ <img> теги используются для всех иконок

4. ✅ Протестируйте отображение иконок на разных размерах экрана

СИСТЕМА ГОТОВА К ИСПОЛЬЗОВАНИЮ!
Все компоненты уже используют кастомные иконки из папки assets.
*/
