import { motion } from 'framer-motion'
import { Briefcase, RussianRuble } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { customToast } from '@/utils/toast'

interface Vacancy {
  id: string
  image_url?: string
  title: string
  description: string
  salary?: string
  created_at: string
  updated_at: string
}

interface VacancyResponse {
  vacancy_id: string
  full_name: string
  phone: string
  username?: string
  vacancy_title: string
  text?: string
}

const Vacancies = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [responseForm, setResponseForm] = useState<VacancyResponse>({
    vacancy_id: '',
    full_name: '',
    phone: '',
    username: '',
    vacancy_title: '',
    text: ''
  })

  // Проверка валидности формы
  const isPhoneValid = (phone: string): boolean => {
    // Проверяем формат: +7 (XXX) XXX-XX-XX (минимум 18 символов с форматированием)
    const cleanPhone = phone.replace(/\D/g, '') // убираем все нецифровые символы
    return cleanPhone.length === 11 && cleanPhone.startsWith('7') && phone.length >= 16
  }

  const isFormValid = responseForm.full_name?.trim() &&
    (isPhoneValid(responseForm.phone) || responseForm.username?.trim())

  useEffect(() => {
    fetchVacancies()
  }, [])

  // Sync modal state with URL
  useEffect(() => {
    const vacancyParam = searchParams.get('vacancy')
    
    if (vacancyParam) {
      const vacancy = vacancies.find(v => v.id === vacancyParam)
      if (vacancy && (!isModalOpen || selectedVacancy?.id !== vacancy.id)) {
        setSelectedVacancy(vacancy)
        setResponseForm({
          vacancy_id: vacancy.id,
          vacancy_title: vacancy.title,
          full_name: '',
          phone: '',
          username: '',
          text: ''
        })
        setIsModalOpen(true)
      }
    } else {
      if (isModalOpen) {
        setIsModalOpen(false)
        setSelectedVacancy(null)
      }
    }
  }, [searchParams, vacancies])

  // Управление скроллом body при открытии модального окна
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Очистка при размонтировании компонента
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen])

  const fetchVacancies = async () => {
    try {
      const response = await fetch('/api/vacancies')
      if (response.ok) {
        const data = await response.json()
        setVacancies(data.data.vacancies || [])
      }
    } catch (error) {
      console.error('Error fetching vacancies:', error)
      customToast.error('Не удалось загрузить вакансии')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = (vacancy: Vacancy) => {
    setSelectedVacancy(vacancy)
    setResponseForm({
      ...responseForm,
      vacancy_id: vacancy.id,
      vacancy_title: vacancy.title
    })
    setIsModalOpen(true)
    // Add vacancy parameter to URL
    setSearchParams({ vacancy: vacancy.id })
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedVacancy(null)
    // Remove vacancy parameter from URL
    setSearchParams({})
  }

  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields - don't show toast, validation is visible in form
    if (!responseForm.full_name?.trim()) {
      return
    }

    // Validate that either complete phone or username is provided
    if (!isPhoneValid(responseForm.phone) && !responseForm.username?.trim()) {
      return
    }

    try {
      const response = await fetch('/api/vacancies/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseForm),
      })

      if (response.ok) {
        customToast.success('🎉 Отклик отправлен!\nМы уже изучаем вашу кандидатуру и свяжемся в ближайшее время ✨', {
          icon: '💼',
        })
        closeModal()
        setResponseForm({
          vacancy_id: '',
          full_name: '',
          phone: '',
          username: '',
          vacancy_title: '',
          text: ''
        })
      } else {
        customToast.error('К сожалению, произошла ошибка\nПожалуйста, попробуйте отправить отклик еще раз 💙', {
          icon: '😔',
        })
      }
    } catch (error) {
      console.error('Error submitting response:', error)
      customToast.error('К сожалению, произошла ошибка\nПожалуйста, попробуйте отправить отклик еще раз 💙', {
        icon: '😔',
      })
    }
  }

  const formatPhoneNumber = (value: string): string => {
    // Убираем все нецифровые символы
    const phoneNumber = value.replace(/\D/g, '')

    // Если начинается с 9, добавляем +7
    if (phoneNumber.startsWith('9') && phoneNumber.length === 1) {
      return '+7'
    }

    // Если начинается с 7 или 8, заменяем на +7
    if (phoneNumber.startsWith('7') || phoneNumber.startsWith('8')) {
      return '+7' + phoneNumber.substring(1)
    }

    // Если уже есть +7, продолжаем форматирование
    if (phoneNumber.startsWith('7') && value.startsWith('+7')) {
      const digits = phoneNumber.substring(1) // убираем первую 7

      if (digits.length <= 3) {
        return `+7 (${digits}`
      } else if (digits.length <= 6) {
        return `+7 (${digits.substring(0, 3)}) ${digits.substring(3)}`
      } else if (digits.length <= 8) {
        return `+7 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`
      } else {
        return `+7 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8, 10)}`
      }
    }

    // Если ввод начинается не с 7/8/9, возвращаем как есть
    return value
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Специальная обработка для поля телефона
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value)
      setResponseForm({
        ...responseForm,
        [name]: formattedPhone
      })
    } else {
      setResponseForm({
        ...responseForm,
        [name]: value
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <section className="border-b border-gray-200 dark:border-gray-800">
          <div className="container-custom py-14">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl mx-auto"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm mb-4"
              >
                💼 Вакансии
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3"
              >
                Присоединяйтесь к нашей команде
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-base md:text-lg text-gray-600 dark:text-gray-400"
              >
                Мы ищем талантливых и мотивированных сотрудников
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Vacancies List */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="py-12"
        >
          <div className="container-custom">
            {vacancies.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="text-center py-12"
              >
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  Вакансий пока нет
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Следите за обновлениями - скоро появятся новые вакансии!
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={`grid gap-6 ${
                  vacancies.length === 1
                    ? 'max-w-sm mx-auto'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {vacancies.map((vacancy, index) => (
                  <motion.div
                    key={vacancy.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.1 * index,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{
                      y: -5,
                      transition: { duration: 0.2 }
                    }}
                    onClick={() => handleApply(vacancy)}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer aspect-square overflow-hidden"
                  >
                    {vacancy.image_url && (
                      <div className="h-1/2 overflow-hidden">
                        <img
                          src={vacancy.image_url}
                          alt={vacancy.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-4 h-1/2 flex flex-col">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2 line-clamp-1">
                        {vacancy.title}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 flex-1 leading-tight">
                        {vacancy.description.length > 100
                          ? `${vacancy.description.substring(0, 100)}...`
                          : vacancy.description
                        }
                      </p>

                      {vacancy.salary && (
                        <div className="flex items-center text-sm text-green-600 dark:text-green-400 mt-auto">
                          <RussianRuble className="w-3.5 h-3.5 mr-1" />
                          {vacancy.salary}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Application Modal */}
        {isModalOpen && selectedVacancy && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full max-h-[85vh] overflow-y-auto shadow-lg modal-scroll"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <style dangerouslySetInnerHTML={{
                __html: `
                  .modal-scroll::-webkit-scrollbar {
                    width: 6px;
                  }
                  .modal-scroll::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 3px;
                  }
                  .modal-scroll::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                    transition: background 0.2s;
                  }
                  .modal-scroll::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                  }
                  .dark .modal-scroll::-webkit-scrollbar-track {
                    background: #374151;
                  }
                  .dark .modal-scroll::-webkit-scrollbar-thumb {
                    background: #6b7280;
                  }
                  .dark .modal-scroll::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                  }
                `
              }} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Отклик на вакансию
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-5">
                  {selectedVacancy.image_url && (
                    <div className="mb-4">
                      <img
                        src={selectedVacancy.image_url}
                        alt={selectedVacancy.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-lg">
                      {selectedVacancy.title}
                    </h4>
                    {selectedVacancy.salary && (
                      <div className="flex items-center text-sm text-green-600 dark:text-green-400 mb-3">
                        <RussianRuble className="w-4 h-4 mr-1" />
                        {selectedVacancy.salary}
                      </div>
                    )}
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {selectedVacancy.description}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleResponseSubmit} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      name="full_name"
                      required
                      value={responseForm.full_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Ваше имя *"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Выберите способ связи (обязательно):
                    </p>
                    <input
                      type="text"
                      name="phone"
                      value={responseForm.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="+7 (912) 345-67-89"
                    />
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">или</div>
                    <input
                      type="text"
                      name="username"
                      value={responseForm.username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Telegram (@username или ссылка)"
                    />
                  </div>

                  <div>
                    <textarea
                      name="text"
                      value={responseForm.text}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                      placeholder="Расскажите о себе (необязательно)..."
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={!isFormValid}
                      className={`flex-1 px-3 py-2 rounded-md font-medium transition-colors text-sm ${
                        isFormValid
                          ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Отправить
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
    </div>
  )
}

export default Vacancies
