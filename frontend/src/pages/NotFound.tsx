import { Link } from 'react-router-dom'
import { ArrowLeftCircle } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 text-white shadow-lg mb-6">
        <ArrowLeftCircle className="w-12 h-12" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
      <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-xl mb-8">
        Страница, которую вы ищете, не найдена. Возможно, ссылка устарела или была удалена.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md transition-colors"
      >
        Вернуться на главную
      </Link>
    </div>
  )
}

export default NotFound
