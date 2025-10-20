import { motion } from 'framer-motion'
import { Mail, Phone, Send, MessageCircle, Shield } from 'lucide-react'
import { telegram } from '@/assets/icons/social'
import { useState } from 'react'
import { customToast } from '@/utils/toast'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    telegram: '',
    phone: '',
    subject: '',
    message: ''
  })

  const [contactValidationError, setContactValidationError] = useState(false)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate that at least one contact method is provided
    if (!formData.phone?.trim() && !formData.telegram?.trim()) {
      setContactValidationError(true)
      // Simply set validation error state, don't show toast
      return
    }

    // Clear validation error if validation passes
    setContactValidationError(false)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        customToast.success('🎉 Сообщение отправлено!\nМы уже изучаем ваш вопрос и свяжемся в ближайшее время ✨', {
          icon: '💌',
        })
        setFormData({
          name: '',
          telegram: '',
          phone: '',
          subject: '',
          message: ''
        })
      } else {
        customToast.error('К сожалению, произошла ошибка. Пожалуйста, попробуйте отправить сообщение еще раз')
      }
      } catch (error) {
      console.error('Error submitting form:', error)
      customToast.error('К сожалению, произошла ошибка. Пожалуйста, попробуйте отправить сообщение еще раз')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })

    // Clear validation error when user starts typing in contact fields
    if ((e.target.name === 'phone' || e.target.name === 'telegram') && contactValidationError) {
      setContactValidationError(false)
    }
  }


  const contactInfo = [
    {
      icon: Phone,
      title: 'Горячая линия',
      details: ['+7 (4212) 66-60-60', 'Звонки круглосуточно']
    },
    {
      icon: MessageCircle,
      title: 'Telegram чат',
      details: ['Быстрые ответы', 'Мгновенная поддержка']
    },
    {
      icon: Mail,
      title: 'Email',
      details: ['medusa666060@mail.ru', 'Для официальных обращений']
    },
    {
      icon: Shield,
      title: 'Гарантии',
      details: ['Официальная гарантия', 'На все товары']
    }
  ]

  const subjects = [
    'Консультация по товарам',
    'Гарантийное обслуживание',
    'Предложение сотрудничества',
    'Предложения и отзывы',
    'Другое'
  ]

  const quickActions = [
    {
      icon: Phone,
      title: 'Позвонить сейчас',
      subtitle: '+7 (4212) 66-60-60',
      href: 'tel:+74212666060'
    },
    {
      icon: telegram,
      title: 'Telegram чат',
      subtitle: 'Мгновенные ответы',
      href: 'https://t.me/+991rXYux6AFjYzYy',
      isCustomIcon: true
    },
    {
      icon: Mail,
      title: 'Написать email',
      subtitle: 'medusa666060@mail.ru',
      href: 'mailto:medusa666060@mail.ru'
    }
  ]

  const faqs = [
    {
      q: 'Какие гарантии вы предоставляете?',
      a: 'Мы предоставляем гарантию 14 дней только на многоразовые устройства. Гарантия не распространяется на одноразовые устройства и расходные материалы.'
    },
    {
      q: 'Можно ли вернуть товар?',
      a: 'Возврат возможен в течение 14 дней с момента покупки при соблюдении условий возврата. Товар должен быть в оригинальной упаковке и не иметь следов использования.'
    },
    {
      q: 'Как стать участником бонусной программы?',
      a: 'Присоединиться к бонусной программе можно через наш Telegram-бот или при регистрации на сайте. Получайте бонусы и скидки за каждую покупку!'
    }
  ]

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
              className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm mb-4"
            >
              Свяжитесь с нами
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3"
            >
              Мы всегда на связи
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-base md:text-lg text-gray-600 dark:text-gray-400"
            >
              Выберите удобный способ. Ответим быстро и по делу.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="py-12"
      >
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
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
                className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <info.icon className="w-7 h-7 text-gray-700 dark:text-gray-200" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{info.title}</h3>
                <div className="space-y-1">
                  {info.details.map((detail, detailIndex) => (
                    <motion.p
                      key={detail}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.1 * index + 0.1 * detailIndex
                      }}
                      className="text-gray-700 dark:text-gray-200"
                    >
                      {detail}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Contact Form & Quick Actions */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="py-12 bg-gray-50 dark:bg-gray-900"
      >
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="lg:col-span-2"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="mb-6">
                  <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm mb-3">
                    Форма обратной связи
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Напишите нам</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Мы ответим в течение 48 часов</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ваше имя *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                      placeholder="Ваше имя"
                    />
                  </div>
                    {/* Contact Information Section */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Как с вами связаться?
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          Телефон или Telegram
                        </p>

                        {/* Phone Field */}
                        <div className="mb-3">
                          <label htmlFor="phone" className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Телефон
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                              contactValidationError && !formData.phone?.trim() && !formData.telegram?.trim()
                                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-gray-900 dark:text-white focus:ring-red-500'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-gray-500'
                            }`}
                            placeholder="+7 (4212) 66-60-60"
                          />
                        </div>

                        {/* Telegram Field */}
                        <div className="mb-2">
                          <label htmlFor="telegram" className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Telegram
                          </label>
                          <input
                            type="text"
                            id="telegram"
                            name="telegram"
                            value={formData.telegram}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                              contactValidationError && !formData.phone?.trim() && !formData.telegram?.trim()
                                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-gray-900 dark:text-white focus:ring-red-500'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-gray-500'
                            }`}
                            placeholder="@username или ссылка на Telegram"
                          />
                        </div>

                        {/* Error Message */}
                        {contactValidationError && !formData.phone?.trim() && !formData.telegram?.trim() && (
                          <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400">
                            <span className="mr-2">⚠️</span>
                            Пожалуйста, укажите телефон или Telegram для связи
                          </div>
                        )}

                        {/* Success indicator when at least one field is filled */}
                        {(formData.phone?.trim() || formData.telegram?.trim()) && (
                          <div className="flex items-center mt-2 text-sm text-green-600 dark:text-green-400">
                            <span className="mr-2">✅</span>
                            Отлично! Мы сможем с вами связаться
                          </div>
                        )}
                      </div>
                    </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Тема обращения
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                    >
                      <option value="">Выберите тему обращения</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ваше сообщение
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm resize-none"
                      placeholder="Опишите ваш вопрос или проблему"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-xl font-medium text-base hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Send className="w-4 h-4 mr-2 inline" />
                    Отправить сообщение
                  </motion.button>
                </form>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="space-y-4"
            >
              {quickActions.map((action, index) => (
                <motion.a
                  key={action.title}
                  href={action.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.2 * index,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-4">
                    {action.isCustomIcon ? (
                      <img src={action.icon} alt={action.title} className="w-6 h-6" />
                    ) : (
                      <action.icon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{action.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{action.subtitle}</p>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.6 }}
        className="py-12"
      >
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm mb-3">
              Частые вопросы
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-white"
            >
              Возможно, ответ уже здесь
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-base text-gray-600 dark:text-gray-400"
            >
              Самые популярные вопросы от наших клиентов
            </motion.p>
          </motion.div>

          <div className="max-w-6xl mx-auto">
            {/* Первый ряд - 2 блока */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
            >
              {faqs.slice(0, 2).map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.6,
                    delay: 1.1 + 0.2 * index,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{
                    y: -3,
                    transition: { duration: 0.2 }
                  }}
                  className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-lg"
                >
                  <motion.h4
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.3 + 0.2 * index }}
                    className="font-semibold mb-3 text-gray-900 dark:text-white text-lg"
                  >
                    {faq.q}
                  </motion.h4>
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.4 + 0.2 * index }}
                    className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm"
                  >
                    {faq.a}
                  </motion.p>
                </motion.div>
              ))}
            </motion.div>

            {/* Второй ряд - 1 блок по центру */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
              className="flex justify-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 1.7,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-lg max-w-2xl w-full lg:w-1/2"
              >
                <motion.h4
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.9 }}
                  className="font-semibold mb-3 text-gray-900 dark:text-white text-lg"
                >
                  {faqs[2].q}
                </motion.h4>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 2.0 }}
                  className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm"
                >
                  {faqs[2].a}
                </motion.p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2.2 }}
        className="py-12 border-t border-gray-200 dark:border-gray-800"
      >
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-white"
            >
              Остались вопросы?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-6"
            >
              Мы готовы ответить и помочь с выбором
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <motion.a
                href="tel:+74212666060"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Позвонить сейчас
              </motion.a>
              <motion.a
                href="https://t.me/+991rXYux6AFjYzYy"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl"
              >
                <span className="inline-flex items-center">
                  <img src={telegram} alt="Telegram" className="w-5 h-5 mr-2" />
                  Telegram чат
                </span>
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}

export default Contact