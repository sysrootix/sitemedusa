import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Phone, Clock, Navigation, Store, Map as MapIcon, Filter, X, ChevronDown, Search, ArrowUpDown } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import api from '@/services/api'
import InteractiveMap from '@/components/InteractiveMap'
import { yandexmaps, googlemaps, twogis } from '@/assets/icons/social'

interface Shop {
  id: number
  name: string
  address: string
  city: string
  phone: string
  working_hours: string
  latitude: string
  longitude: string
  description?: string
  yandex_maps_url?: string
  google_maps_url?: string
  twogis_url?: string
}

interface WindowWithShopDetail extends Window {
  shopDetail: (shopId: number) => void
}

type SortKey = 'city' | 'name' | 'distance'

const Shops = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [shops, setShops] = useState<Shop[]>([])
  const [filteredShops, setFilteredShops] = useState<Shop[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [selectedCity, setSelectedCity] = useState<string>('Все')
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [viewMode] = useState<'list' | 'map'>('list')
  const [mapZoom, setMapZoom] = useState<number>(10)
  const [leafletLoaded, setLeafletLoaded] = useState<boolean>(false)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('city')

  // Global function for Yandex Maps balloon button
  useEffect(() => {
    (window as unknown as WindowWithShopDetail).shopDetail = (shopId: number) => {
      const shop = shops.find(s => s.id === shopId)
      if (shop) {
        setSelectedShop(shop)
        // Add shop parameter to URL
        setSearchParams({ shop: shop.id.toString() })
      }
    }
  }, [shops, setSearchParams])

  // Sync modal state with URL
  useEffect(() => {
    const shopParam = searchParams.get('shop')
    
    if (shopParam) {
      const shopId = parseInt(shopParam)
      const shop = shops.find(s => s.id === shopId)
      if (shop && (!selectedShop || selectedShop.id !== shop.id)) {
        setSelectedShop(shop)
      }
    } else {
      if (selectedShop) {
        setSelectedShop(null)
      }
    }
  }, [searchParams, shops])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return
    const originalOverflow = document.body.style.overflow
    if (selectedShop) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = originalOverflow || ''
    }
    return () => {
      document.body.style.overflow = originalOverflow || ''
    }
  }, [selectedShop])

  // Load Leaflet library
  useEffect(() => {
    if (typeof window === 'undefined') return

    if ('L' in window && (window as typeof window & { L: unknown }).L) {
      setLeafletLoaded(true)
      return
    }

    const cssLink = document.createElement('link')
    cssLink.rel = 'stylesheet'
    cssLink.href = '/api/maps/leaflet-css'
    document.head.appendChild(cssLink)

    const script = document.createElement('script')
    script.src = '/api/maps/leaflet-js'
    script.async = true
    script.onload = () => setLeafletLoaded(true)
    script.onerror = () => console.error('Failed to load Leaflet library')
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(cssLink)) document.head.removeChild(cssLink)
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const [shopsData, citiesData] = await Promise.all([
          api.getShops(),
          api.getShopCities()
        ])
        if (mounted) {
          setShops(shopsData)
          setFilteredShops(shopsData)
          setCities(['Все', ...citiesData])
        }
      } catch (e: unknown) {
        if (mounted) setError(api.handleApiError(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Derived list with search and sorting
  const visibleShops = useMemo(() => {
    const q = query.trim().toLowerCase()
    let base = selectedCity === 'Все' ? filteredShops : filteredShops.filter(s => s.city === selectedCity)
    if (q) {
      base = base.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.address || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q)
      )
    }
    const sorted = [...base]
    if (sortKey === 'city') sorted.sort((a, b) => a.city.localeCompare(b.city))
    if (sortKey === 'name') sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return sorted
  }, [filteredShops, selectedCity, query, sortKey])

  useEffect(() => {
    if (selectedCity === 'Все') setFilteredShops(shops)
    else setFilteredShops(shops.filter(shop => shop.city === selectedCity))
  }, [selectedCity, shops])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Что-то пошло не так</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium">Попробовать снова</button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Загружаем магазины</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Подбираем лучшие локации для вас</p>
        </div>
      </div>
    )
  }

  const getMapCenter = () => {
    if (visibleShops.length === 0) return [48.4802, 135.0716]
    const validShops = visibleShops.filter(shop => {
      const lat = parseFloat(shop.latitude)
      const lng = parseFloat(shop.longitude)
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    })
    if (validShops.length === 0) return [48.4802, 135.0716]
    const avgLat = validShops.reduce((sum, shop) => sum + parseFloat(shop.latitude), 0) / validShops.length
    const avgLng = validShops.reduce((sum, shop) => sum + parseFloat(shop.longitude), 0) / validShops.length
    const finalLat = isNaN(avgLat) ? 48.4802 : Math.max(-90, Math.min(90, avgLat))
    const finalLng = isNaN(avgLng) ? 135.0716 : Math.max(-180, Math.min(180, avgLng))
    return [finalLat, finalLng]
  }

  const openShopModal = (shop: Shop) => {
    setSelectedShop(shop)
    // Add shop parameter to URL
    setSearchParams({ shop: shop.id.toString() })
  }

  const closeShopModal = () => {
    setSelectedShop(null)
    // Remove shop parameter from URL
    setSearchParams({})
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container-custom py-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm mb-3"
          >
            <Store className="w-4 h-4 mr-2" /> Где купить
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2"
          >
            Наши магазины
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Найдите ближайший магазин. Фильтруйте, ищите, стройте маршрут.
          </motion.p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch mb-8"
        >
          {/* City & Filter */}
          <div className="relative">
            <button onClick={() => setShowFilters(!showFilters)} className="w-full h-full min-h-[44px] flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
              <span className="inline-flex items-center text-gray-900 dark:text-white"><Filter className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" /> {selectedCity}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50">
                  <div className="p-2 max-h-72 overflow-y-auto">
                    {cities.map((city) => (
                      <button key={city} onClick={() => { setSelectedCity(city); setShowFilters(false) }} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm ${selectedCity === city ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{city}</button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search */}
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по адресу, городу или телефону"
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400"
              aria-label="Поиск магазинов"
            />
          </label>

          {/* Sort */}
          <label className="relative block">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="appearance-none w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
              aria-label="Сортировать по"
            >
              <option value="city">Город (А→Я)</option>
              <option value="name">Название (А→Я)</option>
              <option value="distance" disabled>Расстояние (скоро)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </label>
          </motion.div>

        {/* Summary */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Найдено: <span className="font-semibold text-gray-900 dark:text-white">{visibleShops.length}</span> магазинов в <span className="font-semibold text-gray-900 dark:text-white">{selectedCity === 'Все' ? 'всех городах' : selectedCity}</span></div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Подсказка: кликните на карточку для подробностей и маршрута</div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {visibleShops.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center py-20"
                >
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Store className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ничего не нашлось</h3>
                  <p className="text-gray-600 dark:text-gray-300">Попробуйте изменить фильтр города или строку поиска</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {visibleShops.map((shop, index) => (
                    <motion.div
                      key={shop.id}
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
                      className="text-left bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-lg"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                            </div>
                            <div>
                              <div className="text-base font-semibold text-gray-900 dark:text-white">{shop.city}</div>
                              {shop.name && <div className="text-xs text-gray-500 dark:text-gray-400">{shop.name}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {shop.yandex_maps_url && (
                              <a href={shop.yandex_maps_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title="Яндекс Карты">
                                <img src={yandexmaps} alt="Яндекс" className="w-4 h-4" />
                              </a>
                            )}
                            {shop.google_maps_url && (
                              <a href={shop.google_maps_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" title="Google Maps">
                                <img src={googlemaps} alt="Google" className="w-4 h-4" />
                              </a>
                            )}
                            {shop.twogis_url && (
                              <a href={shop.twogis_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors" title="2ГИС">
                                <img src={twogis} alt="2ГИС" className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        {shop.address && (
                          <div className="flex items-start space-x-3 mb-3">
                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              <MapIcon className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{shop.address}</div>
                          </div>
                        )}
                        {(shop.phone || shop.working_hours) && (
                          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            {shop.phone && (
                              <a href={`tel:${shop.phone}`} className="flex items-center space-x-2 text-sm font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <Phone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                <span>{shop.phone}</span>
                              </a>
                            )}
                            {shop.working_hours && (
                              <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                                <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                <span className="whitespace-pre-line">{shop.working_hours}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => openShopModal(shop)} className="px-3 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-semibold flex items-center justify-center">
                            Подробнее
                          </button>
                          {(shop.twogis_url || shop.yandex_maps_url) && (
                            <a href={shop.twogis_url || shop.yandex_maps_url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-semibold text-gray-900 dark:text-white flex items-center justify-center transition-colors">
                              <Navigation className="w-4 h-4 mr-1" /> Маршрут
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative h-[600px] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              {leafletLoaded ? (
                <InteractiveMap shops={visibleShops} center={getMapCenter() as [number, number]} zoom={mapZoom} onShopClick={(s) => openShopModal(s)} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full mx-auto mb-3 animate-spin" />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Загружаем карту</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Подключаемся к OpenStreetMap...</p>
                  </div>
                </div>
              )}
              {leafletLoaded && (
                <div className="absolute top-4 right-4 flex flex-col space-y-2">
                  <button onClick={() => setMapZoom(prev => Math.min(prev + 1, 18))} className="w-9 h-9 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">+</button>
                  <button onClick={() => setMapZoom(prev => Math.max(prev - 1, 1))} className="w-9 h-9 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">−</button>
                </div>
              )}
            </motion.div>
            )}
          </AnimatePresence>
        </div>

      {/* Shop Modal */}
      <AnimatePresence>
        {selectedShop && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeShopModal}>
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
                <button onClick={closeShopModal} className="absolute top-4 right-4 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                  <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedShop.city}</h2>
                    {selectedShop.name && <p className="text-xs text-gray-500 dark:text-gray-400">{selectedShop.name}</p>}
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-96">
                {selectedShop.address && (
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">Адрес</div>
                      <div className="text-gray-600 dark:text-gray-300">{selectedShop.address}</div>
                    </div>
                  </div>
                )}
                {selectedShop.phone && (
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">Телефон</div>
                      <a href={`tel:${selectedShop.phone}`} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">{selectedShop.phone}</a>
                    </div>
                  </div>
                )}
                {selectedShop.working_hours && (
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">Часы работы</div>
                      <div className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{selectedShop.working_hours}</div>
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  {selectedShop.yandex_maps_url && (
                    <a href={selectedShop.yandex_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors w-full sm:w-auto">
                      <img src={yandexmaps} alt="Яндекс" className="w-5 h-5 mr-2" /> Яндекс Карты
                    </a>
                  )}
                  {selectedShop.google_maps_url && (
                    <a href={selectedShop.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-medium transition-colors w-full sm:w-auto">
                      <img src={googlemaps} alt="Google" className="w-5 h-5 mr-2" /> Google Maps
                    </a>
                  )}
                  {selectedShop.twogis_url && (
                    <a href={selectedShop.twogis_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors w-full sm:w-auto">
                      <img src={twogis} alt="2ГИС" className="w-5 h-5 mr-2" /> 2ГИС
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Shops



