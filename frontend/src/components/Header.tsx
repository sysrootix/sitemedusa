import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { customToast } from '@/utils/toast'
import { buildProductUrl, slugify } from '@/utils/catalogUrl'
import { Menu, X, ShoppingCart, Search, LogIn, User as UserIcon, LogOut, ChevronDown, Trash2, Minus, Plus, PackageX, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AuthModal, Modal } from '@/shared/ui'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/contexts/CartContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import apiService from '@/services/api'

const Header = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false)
  const [isCartModalOpen, setIsCartModalOpen] = useState(false)
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [clickedItem, setClickedItem] = useState<string | null>(null)
  const [selectedCartItems, setSelectedCartItems] = useState<Set<string>>(new Set())
  const [selectedFavoriteItems, setSelectedFavoriteItems] = useState<Set<string>>(new Set())
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, isLoading} = useAuth()
  const { cart, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart()
  const { favorites, favoritesCount, toggleFavorite, clearFavorites } = useFavorites()
  const [checkingStock, setCheckingStock] = useState<string | null>(null)

  const handleSearchClick = () => {
    navigate('/catalog')
  }

  const openProductById = async (productId: string, fallbackName?: string, fallbackCategory?: string) => {
    try {
      const productData = await apiService.getProductById(productId)
      const productSlug = productData.product.slug || slugify(productData.product.name || fallbackName || productId) || productId

      let categoryPath: string | null = null

      if (productData.product.characteristics?.full_path && typeof productData.product.characteristics.full_path === 'string') {
        categoryPath = productData.product.characteristics.full_path
      } else if (productData.product.category_path && typeof productData.product.category_path === 'string') {
        categoryPath = productData.product.category_path
      } else if (fallbackCategory) {
        categoryPath = fallbackCategory
      }

      const productUrl = buildProductUrl(productSlug, categoryPath)
      navigate(productUrl)
    } catch (error) {
      console.error('Failed to open product page:', error)
      customToast.error('Не удалось открыть карточку товара')
    }
  }

  const handleCartClick = () => {
    if (!isAuthenticated) {
      customToast.error('Войдите в аккаунт, чтобы использовать корзину', {
        icon: '🛒',
      })
      openAuthModal()
    } else {
      setSelectedCartItems(new Set()) // Reset selection when opening cart
      setIsCartModalOpen(true)
    }
  }

  const handleSelectAllCartItems = () => {
    if (selectedCartItems.size === cart.length) {
      setSelectedCartItems(new Set())
    } else {
      setSelectedCartItems(new Set(cart.map(item => item.id)))
    }
  }

  const handleDeleteSelectedItems = async () => {
    if (selectedCartItems.size === 0) return
    
    if (window.confirm(`Удалить выбранные товары (${selectedCartItems.size})?`)) {
      try {
        await Promise.all(
          Array.from(selectedCartItems).map(itemId => removeFromCart(itemId))
        )
        setSelectedCartItems(new Set())
        customToast.success(`Удалено товаров: ${selectedCartItems.size}`)
      } catch (error) {
        customToast.error('Не удалось удалить товары')
      }
    }
  }

  // Check stock before increasing quantity
  const handleIncreaseQuantity = async (item: any) => {
    setCheckingStock(item.id)
    try {
      // Get fresh product data from API
      const productData = await apiService.getProductById(item.product?.id)
      
      // Find the shop
      const shop = productData.shops.find((s: any) => s.shop_code === item.shop_code)
      
      if (!shop) {
        customToast.error('Магазин не найден')
        return
      }

      let availableQuantity = 0

      // Check if item has modification
      if (item.modification?.id) {
        const modifications = (shop as any).modifications
        if (modifications && Array.isArray(modifications)) {
          const modification = modifications.find((m: any) => m.id === item.modification.id)
          if (modification) {
            availableQuantity = modification.quanty || 0
          }
        }
      } else {
        // No modification, use shop quantity
        availableQuantity = shop.quantity || 0
      }

      // Check if we can increase quantity
      if (item.quantity >= availableQuantity) {
        customToast.error(`В наличии только ${Math.round(availableQuantity)} шт.`, {
          icon: '📦'
        })
        return
      }

      // All good, update quantity
      await updateQuantity(item.id, item.quantity + 1)
    } catch (error: any) {
      console.error('Error checking stock:', error)
      customToast.error('Не удалось проверить остатки товара')
    } finally {
      setCheckingStock(null)
    }
  }

  // Favorites handlers
  const handleSelectAllFavoriteItems = () => {
    if (selectedFavoriteItems.size === favorites.length) {
      setSelectedFavoriteItems(new Set())
    } else {
      setSelectedFavoriteItems(new Set(favorites.map(item => item.product_id)))
    }
  }

  const handleDeleteSelectedFavorites = async () => {
    if (selectedFavoriteItems.size === 0) return
    
    if (window.confirm(`Удалить выбранные товары из избранного (${selectedFavoriteItems.size})?`)) {
      try {
        await Promise.all(
          Array.from(selectedFavoriteItems).map(productId => toggleFavorite(productId))
        )
        setSelectedFavoriteItems(new Set())
      } catch (error) {
        customToast.error('Не удалось удалить товары')
      }
    }
  }

  // Sync auth modal state with URL
  useEffect(() => {
    const authParam = searchParams.get('auth')
    
    if (authParam === 'open') {
      if (!isAuthModalOpen) {
        setIsAuthModalOpen(true)
      }
    } else {
      if (isAuthModalOpen) {
        setIsAuthModalOpen(false)
      }
    }
  }, [searchParams])

  const openAuthModal = () => {
    setIsAuthModalOpen(true)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('auth', 'open')
    setSearchParams(newParams)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('auth')
    setSearchParams(newParams)
  }

  const navigation = [
    { name: 'Главная', href: '/' },
    { name: 'Каталог', href: '/catalog' },
    { name: 'Акции', href: '/promotions', featured: true, style: 'promotions' },
    ...(isAuthenticated ? [] : [{ name: 'Бонусная система', href: '/bonus-system', featured: true, style: 'bonus' }]),
    { name: 'Магазины', href: '/shops' },
  ]

  const companyMenu = [
    { name: 'Статьи', href: '/articles' },
    { name: 'О нас', href: '/about' },
    { name: 'Вакансии', href: '/vacancies' },
    { name: 'Контакты', href: '/contact' },
  ]

  const isActive = (path: string) => location.pathname === path

  // Функция для получения стилей featured кнопок
  const getFeaturedStyles = (item: any, isActive: boolean) => {
    const baseStyles = 'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200'

    switch (item.style) {
      case 'promotions':
        return cn(
          baseStyles,
          'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700',
          'before:absolute before:-top-1 before:-right-1 before:w-2 before:h-2 before:bg-yellow-400 before:rounded-full before:animate-pulse',
          isActive && 'ring-2 ring-purple-300'
        )
      case 'bonus':
        return cn(
          baseStyles,
          'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700',
          'before:absolute before:-top-1 before:-right-1 before:w-2 before:h-2 before:bg-cyan-400 before:rounded-full before:animate-pulse',
          isActive && 'ring-2 ring-indigo-300'
        )
      default:
        return cn(
          baseStyles,
          'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700',
          'before:absolute before:-top-1 before:-right-1 before:w-2 before:h-2 before:bg-yellow-400 before:rounded-full before:animate-pulse',
          isActive && 'ring-2 ring-purple-300'
        )
    }
  }

  // Обработчик клика вне меню для его закрытия
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Закрываем мобильное меню
      if (isMenuOpen) {
        const menu = document.getElementById('mobile-menu')
        const menuButton = document.querySelector('[aria-controls="mobile-menu"]')

        // Закрываем меню если клик не на меню и не на кнопке открытия меню
        if (menu && !menu.contains(event.target as Node) &&
            menuButton && !menuButton.contains(event.target as Node)) {
          setIsMenuOpen(false)
        }
      }

      // Закрываем company меню
      if (isCompanyMenuOpen) {
        const companyButton = document.querySelector('[aria-haspopup="true"]')
        const companyMenu = document.querySelector('[role="menu"]')

        if (companyButton && companyMenu &&
            !companyButton.contains(event.target as Node) &&
            !companyMenu.contains(event.target as Node)) {
          setIsCompanyMenuOpen(false)
        }
      }
    }

    if (isMenuOpen || isCompanyMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isMenuOpen, isCompanyMenuOpen])

  // Блокировка скролла body при открытом мобильном меню
  useEffect(() => {
    if (isMenuOpen) {
      // Сохраняем текущую позицию скролла
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'

      // Добавляем блюр только к основному контенту, исключая header
      const mainContent = document.querySelector('main') || document.querySelector('#root > div') || document.body.children[0]
      if (mainContent) {
        ;(mainContent as HTMLElement).style.filter = 'blur(2px)'
      }
    } else {
      // Восстанавливаем позицию скролла
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''

      // Убираем блюр с основного контента
      const mainContent = document.querySelector('main') || document.querySelector('#root > div') || document.body.children[0]
      if (mainContent) {
        ;(mainContent as HTMLElement).style.filter = ''
      }

      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1)
      }
    }

    // Очистка при размонтировании компонента
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''

      const mainContent = document.querySelector('main') || document.querySelector('#root > div') || document.body.children[0]
      if (mainContent) {
        ;(mainContent as HTMLElement).style.filter = ''
      }
    }
  }, [isMenuOpen])

  // Обработка свайпа для закрытия меню
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance

    if (isLeftSwipe) {
      setIsMenuOpen(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setIsUserMenuOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
      customToast.error('Не удалось выйти из аккаунта')
    }
  }

  const handleNavClick = (_href: string, itemName: string) => {
    setClickedItem(itemName)
    // Сбрасываем состояние через 600ms (после завершения анимации)
    setTimeout(() => setClickedItem(null), 600)
  }

  return (
    <>
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <img
                src="/assets/icons/ico.png"
                alt="Medusa Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Medusa
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6" role="navigation" aria-label="Основная навигация">
            {navigation.map((item) => (
              <motion.div
                key={item.name}
                animate={clickedItem === item.name ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                  transition: { duration: 0.6, ease: "easeInOut" }
                } : {}}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={item.href}
                  onClick={() => handleNavClick(item.href, item.name)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden',
                    item.featured
                      ? getFeaturedStyles(item, isActive(item.href))
                      : cn(
                          isActive(item.href)
                            ? 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30'
                            : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                        ),
                    clickedItem === item.name && 'ring-2 ring-purple-400 ring-opacity-50 shadow-lg shadow-purple-500/20'
                  )}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.featured && (item.style === 'promotions' ? '🔥 ' : item.style === 'bonus' ? '💎 ' : '🎁 ')}{item.name}
                  {/* Ripple effect */}
                  {clickedItem === item.name && (
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 4, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0 bg-purple-400/20 rounded-lg"
                    />
                  )}
                </Link>
              </motion.div>
            ))}

            {/* Company Menu Dropdown */}
            <div className="relative">
              <motion.button
                animate={clickedItem === 'Компания' ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 3, -3, 0],
                  transition: { duration: 0.6, ease: "easeInOut" }
                } : {}}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsCompanyMenuOpen(!isCompanyMenuOpen)
                  handleNavClick('#company', 'Компания')
                }}
                className={cn(
                  'flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden',
                  companyMenu.some(item => isActive(item.href))
                    ? 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30'
                    : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
                  clickedItem === 'Компания' && 'ring-2 ring-purple-400 ring-opacity-50 shadow-lg shadow-purple-500/20'
                )}
                aria-expanded={isCompanyMenuOpen}
                aria-haspopup="true"
              >
                Компания
                <motion.div
                  animate={clickedItem === 'Компания' ? {
                    scale: [1, 1.2, 1],
                    transition: { duration: 0.6, ease: "easeInOut" }
                  } : {}}
                >
                  <ChevronDown className={cn(
                    'w-4 h-4 ml-1 transition-transform duration-200',
                    isCompanyMenuOpen ? 'rotate-180' : ''
                  )} />
                </motion.div>
                {/* Ripple effect */}
                {clickedItem === 'Компания' && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 bg-purple-400/20 rounded-lg"
                  />
                )}
              </motion.button>

              <AnimatePresence>
                {isCompanyMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                    role="menu"
                  >
                    {companyMenu.map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          ...(clickedItem === item.name && {
                            scale: [1, 1.05, 1],
                            rotate: [0, 1, -1, 0],
                          })
                        }}
                        transition={{
                          duration: clickedItem === item.name ? 0.6 : 0.2,
                          delay: clickedItem === item.name ? 0 : index * 0.05,
                          ease: "easeOut"
                        }}
                      >
                        <Link
                          to={item.href}
                          onClick={() => {
                            setIsCompanyMenuOpen(false)
                            handleNavClick(item.href, item.name)
                          }}
                          className={cn(
                            'flex items-center px-4 py-3 text-sm transition-colors duration-200 relative overflow-hidden',
                            isActive(item.href)
                              ? 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30'
                              : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
                            clickedItem === item.name && 'ring-1 ring-purple-400 ring-opacity-50 shadow-md shadow-purple-500/10'
                          )}
                          aria-current={isActive(item.href) ? 'page' : undefined}
                        >
                          {item.name}
                          {/* Ripple effect for dropdown */}
                          {clickedItem === item.name && (
                            <motion.div
                              initial={{ scale: 0, opacity: 1 }}
                              animate={{ scale: 4, opacity: 0 }}
                              transition={{ duration: 0.6 }}
                              className="absolute inset-0 bg-purple-400/10 rounded"
                            />
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={handleSearchClick}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 rounded-lg"
              aria-label="Поиск по сайту"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  customToast.error('Войдите в аккаунт, чтобы использовать избранное', {
                    icon: '❤️',
                  })
                  openAuthModal()
                } else {
                  setIsFavoritesModalOpen(true)
                }
              }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 relative rounded-lg"
              aria-label="Избранное"
            >
              <Heart className="w-5 h-5" />
              {favoritesCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg"
                  aria-label={`В избранном ${favoritesCount} товаров`}
                >
                  {favoritesCount}
                </span>
              )}
            </button>
            <button
              onClick={handleCartClick}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 relative rounded-lg"
              aria-label="Корзина покупок"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg"
                  aria-label={`В корзине ${cartCount} товаров`}
                >
                  {cartCount}
                </span>
              )}
            </button>
            
            {/* Auth Section */}
            {isLoading ? (
              <div className="w-20 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 rounded-lg"
                  aria-label="Меню пользователя"
                >
                  {user.photo_url ? (
                    <img
                      src={user.photo_url}
                      alt={user.first_name || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {(user.first_name || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="font-medium">{user.first_name || 'User'}</span>
                </button>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                    >
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                            💰 {user.bonus || 0} бонусов
                          </p>
                        </div>
                      
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          navigate('/profile')
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                      >
                        <UserIcon className="w-4 h-4 mr-3" />
                        Профиль
                      </button>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Выйти
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleCartClick}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 relative rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg">
                      {cartCount}
                    </span>
                  )}
                </button>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={openAuthModal}
                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium py-1.5 px-2.5 rounded text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center"
                    aria-label="Войти в аккаунт"
                  >
                    <LogIn className="w-3.5 h-3.5 mr-1" />
                    <span>Войти</span>
                  </button>
                </motion.div>
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-1">
            <button 
              onClick={() => {
                if (!isAuthenticated) {
                  customToast.error('Войдите в аккаунт, чтобы использовать избранное', {
                    icon: '❤️',
                  })
                  openAuthModal()
                } else {
                  setIsFavoritesModalOpen(true)
                }
              }}
              className="p-3 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 relative rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Heart className="w-5 h-5" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg">
                  {favoritesCount}
                </span>
              )}
            </button>
            <button 
              onClick={handleCartClick}
              className="p-3 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 relative rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20"
              aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <motion.div
                animate={{ rotate: isMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Минималистичный дизайн */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Полноэкранный overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setIsMenuOpen(false)}
              />

              {/* Основное меню - slide из правой стороны */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{
                  type: "spring",
                  damping: 30,
                  stiffness: 300,
                  duration: 0.4
                }}
                className="fixed top-0 right-0 h-screen w-80 max-w-[85vw] bg-white dark:bg-gray-900 z-50 md:hidden shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col"
                id="mobile-menu"
                role="menu"
                aria-label="Мобильное меню навигации"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {/* Header с логотипом и кнопкой закрытия */}
                <div className="flex items-center justify-between p-6 pb-2 flex-shrink-0">
                  <Link
                    to="/"
                    className="flex items-center space-x-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-8 h-8 bg-transparent rounded-lg flex items-center justify-center">
                      <img
                        src="/assets/icons/ico.png"
                        alt="Medusa Logo"
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      Medusa
                    </span>
                  </Link>

                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Закрыть меню"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Навигация */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  <nav>
                    <div className="space-y-1 px-6 pb-6">
                      {navigation.map((item, index) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            ...(clickedItem === item.name && {
                              scale: [1, 1.05, 1],
                              rotate: [0, 2, -2, 0],
                            })
                          }}
                          transition={{
                            duration: clickedItem === item.name ? 0.6 : 0.3,
                            delay: clickedItem === item.name ? 0 : index * 0.05,
                            ease: "easeOut"
                          }}
                        >
                          <Link
                            to={item.href}
                            onClick={() => {
                              setIsMenuOpen(false)
                              handleNavClick(item.href, item.name)
                            }}
                            className={cn(
                              'flex items-center px-4 py-3 rounded-3xl text-base font-medium transition-all duration-300 group relative overflow-hidden',
                              isActive(item.href)
                                ? 'text-white bg-purple-600 dark:text-white dark:bg-purple-600 shadow-sm'
                                : item.featured
                                ? item.style === 'promotions'
                                  ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-700/50 shadow-sm hover:shadow-md hover:from-purple-500/20 hover:to-pink-500/20'
                                  : item.style === 'bonus'
                                  ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-700/50 shadow-sm hover:shadow-md hover:from-indigo-500/20 hover:to-purple-500/20'
                                  : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-700/50 shadow-sm hover:shadow-md hover:from-purple-500/20 hover:to-pink-500/20'
                                : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20',
                              clickedItem === item.name && 'ring-2 ring-purple-400 ring-opacity-50 shadow-lg shadow-purple-500/20'
                            )}
                          >
                            <span className="flex-1">
                              {item.featured && (item.style === 'promotions' ? '🔥 ' : item.style === 'bonus' ? '💎 ' : '🎁 ')}{item.name}
                            </span>
                            {isActive(item.href) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 bg-current rounded-full"
                              />
                            )}
                            {/* Ripple effect for mobile */}
                            {clickedItem === item.name && (
                              <motion.div
                                initial={{ scale: 0, opacity: 1 }}
                                animate={{ scale: 4, opacity: 0 }}
                                transition={{ duration: 0.6 }}
                                className="absolute inset-0 bg-purple-400/20 rounded-3xl"
                              />
                            )}
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </nav>

                  {/* Компания секция */}
                  <div className="px-6 pb-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className="space-y-1"
                    >
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-2">
                        Компания
                      </h3>
                      {companyMenu.map((item, index) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            ...(clickedItem === item.name && {
                              scale: [1, 1.05, 1],
                              rotate: [0, 2, -2, 0],
                            })
                          }}
                          transition={{
                            duration: clickedItem === item.name ? 0.6 : 0.3,
                            delay: clickedItem === item.name ? 0 : 0.2 + index * 0.05,
                            ease: "easeOut"
                          }}
                        >
                          <Link
                            to={item.href}
                            onClick={() => {
                              setIsMenuOpen(false)
                              handleNavClick(item.href, item.name)
                            }}
                            className={cn(
                              'flex items-center px-4 py-3 rounded-3xl text-base font-medium transition-all duration-300 group relative overflow-hidden',
                              isActive(item.href)
                                ? 'text-white bg-purple-600 dark:text-white dark:bg-purple-600 shadow-sm'
                                : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20',
                              clickedItem === item.name && 'ring-2 ring-purple-400 ring-opacity-50 shadow-lg shadow-purple-500/20'
                            )}
                          >
                            <span className="flex-1">{item.name}</span>
                            {isActive(item.href) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 bg-white rounded-full"
                              />
                            )}
                            {/* Ripple effect for mobile company menu */}
                            {clickedItem === item.name && (
                              <motion.div
                                initial={{ scale: 0, opacity: 1 }}
                                animate={{ scale: 4, opacity: 0 }}
                                transition={{ duration: 0.6 }}
                                className="absolute inset-0 bg-purple-400/20 rounded-3xl"
                              />
                            )}
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Разделитель */}
                  <div className="mx-6 my-8 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                  {/* Аккаунт секция */}
                  <div className="px-6">
                    {isAuthenticated && user ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="space-y-3"
                      >
                        {/* User Info */}
                        <div className="flex items-center space-x-3 p-4 rounded-3xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200/50 dark:border-purple-700/50">
                          {user.photo_url ? (
                            <img
                              src={user.photo_url}
                              alt={user.first_name || 'User'}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {(user.first_name || 'U')[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {user.first_name}
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold truncate">
                              💰 {user.bonus || 0} бонусов
                            </p>
                          </div>
                        </div>

                        {/* User Actions */}
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              setIsMenuOpen(false)
                              navigate('/profile')
                            }}
                            className={cn(
                              'flex items-center w-full px-4 py-3 text-left rounded-3xl transition-all duration-200',
                              isActive('/profile')
                                ? 'text-white bg-purple-600 dark:text-white dark:bg-purple-600'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400'
                            )}
                          >
                            <UserIcon className="w-4 h-4 mr-3 opacity-70" />
                            Профиль
                          </button>

                          <button
                            onClick={() => {
                              setIsMenuOpen(false)
                              handleLogout()
                            }}
                            className="flex items-center w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-3xl transition-all duration-200"
                          >
                            <LogOut className="w-4 h-4 mr-3 opacity-70" />
                            Выйти
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <button
                          onClick={() => {
                            setIsMenuOpen(false)
                            openAuthModal()
                          }}
                          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium py-1.5 px-2.5 rounded text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center w-full"
                          aria-label="Войти в аккаунт"
                        >
                          <LogIn className="w-3.5 h-3.5 mr-1" />
                          <span>Войти</span>
                        </button>
                      </motion.div>
                    )}
                  </div>

                  {/* Разделитель */}
                  <div className="mx-6 my-8 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                  {/* Быстрые действия */}
                  <div className="px-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                      className="flex items-center justify-center space-x-4"
                    >
                      <button 
                        onClick={handleSearchClick}
                        className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 rounded-3xl hover:scale-110"
                      >
                        <Search className="w-5 h-5" />
                      </button>

                      <button 
                        onClick={handleCartClick}
                        className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 rounded-3xl hover:scale-110 relative"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                            {cartCount}
                          </span>
                        )}
                      </button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
    
    {/* Auth Modal */}
    <AuthModal 
      isOpen={isAuthModalOpen} 
      onClose={closeAuthModal} 
    />

    {/* Cart Modal */}
    <Modal
      isOpen={isCartModalOpen}
      onClose={() => setIsCartModalOpen(false)}
      size="lg"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Корзина {cart && cart.length > 0 && (
                <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                  ({cartCount} {cartCount === 1 ? 'товар' : cartCount < 5 ? 'товара' : 'товаров'})
                </span>
              )}
            </h2>
          </div>
          {cart && cart.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Вы уверены, что хотите очистить корзину?')) {
                  clearCart()
                  setSelectedCartItems(new Set())
                }
              }}
              className="self-start flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all font-medium"
            >
              <PackageX className="w-4 h-4" />
              Очистить корзину
            </button>
          )}
        </div>

        {cart && cart.length > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={selectedCartItems.size === cart.length && cart.length > 0}
                  onChange={handleSelectAllCartItems}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-md transition-all duration-200 peer-checked:bg-gradient-to-br peer-checked:from-purple-600 peer-checked:to-purple-700 peer-checked:border-purple-600 group-hover:border-purple-500 dark:group-hover:border-purple-400 peer-checked:shadow-sm peer-checked:shadow-purple-500/30">
                  <svg className="w-full h-full text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Выбрать все
              </span>
            </label>
            {selectedCartItems.size > 0 && (
              <button
                onClick={handleDeleteSelectedItems}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Удалить ({selectedCartItems.size})
              </button>
            )}
          </div>
        )}

        {!cart || cart.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Ваша корзина пуста
            </p>
            <button
              onClick={() => {
                setIsCartModalOpen(false)
                navigate('/catalog')
              }}
              className="inline-flex items-center justify-center px-8 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg border-2 border-purple-600 dark:border-purple-400 hover:scale-105"
            >
              Перейти в каталог
            </button>
          </div>
        ) : (
          <>
            <div className="max-h-96 overflow-y-auto space-y-2 md:space-y-3">
              {cart.map((item) => (
                <div 
                  key={item.id} 
                  className="flex gap-2 md:gap-3 p-3 md:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-white dark:border-gray-600 cursor-pointer"
                  onClick={(e) => {
                    // Prevent opening modal if clicking on checkbox, buttons, or quantity controls
                    const target = e.target as HTMLElement;
                    if (!target.closest('input') && !target.closest('button[data-action]') && !target.closest('button') && !target.closest('label')) {
                      if (item.product?.id) {
                        openProductById(
                          item.product.id,
                          item.product?.name,
                          item.product?.characteristics?.full_path || item.product?.category_path
                        )
                      }
                    }
                  }}
                >
                  <label 
                    className="cursor-pointer group flex-shrink-0" 
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                  >
                    <div className="relative mt-0.5 md:mt-1">
                      <input
                        type="checkbox"
                        checked={selectedCartItems.has(item.id)}
                        onChange={() => {
                          const newSelected = new Set(selectedCartItems)
                          if (newSelected.has(item.id)) {
                            newSelected.delete(item.id)
                          } else {
                            newSelected.add(item.id)
                          }
                          setSelectedCartItems(newSelected)
                        }}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-md transition-all duration-200 peer-checked:bg-gradient-to-br peer-checked:from-purple-600 peer-checked:to-purple-700 peer-checked:border-purple-600 group-hover:border-purple-500 dark:group-hover:border-purple-400 peer-checked:shadow-sm peer-checked:shadow-purple-500/30 group-hover:scale-110">
                        <svg className="w-full h-full text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    </div>
                  </label>
                  
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {item.product?.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product?.name || 'Товар'}
                        className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg flex items-center justify-center ${item.product?.image_url ? 'hidden' : ''}`}>
                      <ShoppingCart className="w-6 h-6 md:w-8 md:h-8 text-purple-400 dark:text-purple-600" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {item.product?.name || 'Товар'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                      {item.product?.category_name && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {item.product.category_name}
                        </span>
                      )}
                      {item.modification && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {item.modification.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500 line-clamp-2">
                      {item.product?.city && item.product?.address 
                        ? `${item.product.city}, ${item.product.address}`
                        : item.product?.shop_name || 'Магазин'}
                    </p>
                    <div 
                      className="flex items-center gap-2 md:gap-4 mt-2 md:mt-3" 
                      onClick={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1 md:gap-2 bg-white dark:bg-gray-700 rounded-lg px-1.5 md:px-2 py-0.5 md:py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.quantity > 1) {
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          }}
                          className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors p-0.5 md:p-1"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                        <span className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white min-w-[16px] md:min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIncreaseQuantity(item)
                          }}
                          disabled={checkingStock === item.id}
                          className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors p-0.5 md:p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {checkingStock === item.id ? (
                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          )}
                        </button>
                      </div>
                      <button
                        data-action="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.id)
                        }}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-0.5 md:p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                      {item.total.toFixed(2)} ₽
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500">
                      {item.price.toFixed(2)} ₽ × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 md:pt-4">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <span className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                  Итого:
                </span>
                <span className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {cartTotal.toFixed(2)} ₽
                </span>
              </div>
              <button
                onClick={() => {
                  setIsCartModalOpen(false)
                  navigate('/catalog')
                }}
                className="w-full inline-flex items-center justify-center px-8 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg border-2 border-purple-600 dark:border-purple-400 hover:scale-[1.02]"
              >
                Продолжить покупки
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>

    {/* Favorites Modal */}
    <Modal
      isOpen={isFavoritesModalOpen}
      onClose={() => {
        setIsFavoritesModalOpen(false)
        setSelectedFavoriteItems(new Set())
      }}
      size="lg"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Избранное {favoritesCount > 0 && (
                <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                  ({favoritesCount} {favoritesCount === 1 ? 'товар' : favoritesCount < 5 ? 'товара' : 'товаров'})
                </span>
              )}
            </h2>
          </div>
        </div>

        {favoritesCount === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mb-4 shrink-0">
              <Heart className="w-10 h-10 text-red-500 dark:text-red-400 shrink-0" />
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Нет избранных товаров
            </p>
            <button
              onClick={() => {
                setIsFavoritesModalOpen(false)
                navigate('/catalog')
              }}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg border-2 border-red-600 dark:border-red-400 hover:scale-105"
            >
              Перейти в каталог
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 mb-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={selectedFavoriteItems.size === favorites.length && favorites.length > 0}
                      onChange={handleSelectAllFavoriteItems}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-md peer-checked:bg-gradient-to-r peer-checked:from-red-500 peer-checked:to-red-600 peer-checked:border-transparent transition-all duration-200 flex items-center justify-center group-hover:border-red-400 dark:group-hover:border-red-500">
                      <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {favoritesCount} {favoritesCount === 1 ? 'товар' : favoritesCount < 5 ? 'товара' : 'товаров'}
                  </span>
                </label>
              </div>
              {favoritesCount > 0 && (
                <div className="flex items-center gap-2">
                  {selectedFavoriteItems.size > 0 && (
                    <button
                      onClick={handleDeleteSelectedFavorites}
                      className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Удалить выбранные ({selectedFavoriteItems.size})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm('Вы уверены, что хотите очистить избранное?')) {
                        clearFavorites()
                        setSelectedFavoriteItems(new Set())
                      }
                    }}
                    className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Очистить всё
                  </button>
                </div>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 md:space-y-3">
              {favorites.map((item) => (
                <div 
                  key={item.id} 
                  className="relative flex gap-2 md:gap-3 p-3 md:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl cursor-pointer group border-2 border-white dark:border-gray-600"
                  onClick={(e) => {
                    // Prevent opening modal if clicking on checkbox or delete button
                    const target = e.target as HTMLElement;
                    if (!target.closest('input') && !target.closest('button[data-action]')) {
                      openProductById(
                        item.product_id,
                        item.product_name,
                        item.product?.characteristics?.full_path || item.category_path || item.product?.category_path
                      )
                    }
                  }}
                >
                  {/* Checkbox */}
                  <div className="flex-shrink-0 flex items-start pt-0.5 md:pt-1" onClick={(e) => e.stopPropagation()}>
                    <label className="cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedFavoriteItems.has(item.product_id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newSelected = new Set(selectedFavoriteItems);
                            if (newSelected.has(item.product_id)) {
                              newSelected.delete(item.product_id);
                            } else {
                              newSelected.add(item.product_id);
                            }
                            setSelectedFavoriteItems(newSelected);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-md peer-checked:bg-gradient-to-r peer-checked:from-red-500 peer-checked:to-red-600 peer-checked:border-transparent transition-all duration-200 flex items-center justify-center group-hover:border-red-400 dark:group-hover:border-red-500 group-hover:scale-110">
                          <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Product Image */}
                  <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20">
                    {item.product_data?.image_url ? (
                      <img
                        src={item.product_data.image_url}
                        alt={item.product_name}
                        className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg flex items-center justify-center shrink-0 ${item.product_data?.image_url ? 'hidden' : ''}`}>
                      <Heart className="w-6 h-6 md:w-8 md:h-8 text-red-400 dark:text-red-600 shrink-0" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {item.product_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                      {item.product_data?.category_name && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          {item.product_data.category_name}
                        </span>
                      )}
                    </div>
                    {item.product_data?.price && (
                      <p className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                        {item.product_data.price.toFixed(2)} ₽
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 md:mt-1">
                      Добавлено: {new Date(item.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 md:gap-2 items-end flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      data-action="delete"
                      onClick={() => toggleFavorite(item.product_id, item.product_name)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-0.5 md:p-1"
                      title="Удалить из избранного"
                    >
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                onClick={() => {
                  setIsFavoritesModalOpen(false)
                  navigate('/catalog')
                }}
                className="w-full inline-flex items-center justify-center px-8 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg border-2 border-red-600 dark:border-red-400 hover:scale-[1.02]"
              >
                Продолжить покупки
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
    </>
  )
}

export default Header
