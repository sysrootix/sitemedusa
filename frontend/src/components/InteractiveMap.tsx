import { useEffect, useRef } from 'react'

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
}

interface InteractiveMapProps {
  shops: Shop[]
  center?: [number, number]
  zoom?: number
  onShopClick?: (shop: Shop) => void
  className?: string
}

declare global {
  interface Window {
    L: any
  }
}

const InteractiveMap = ({
  shops,
  center = [55.751244, 37.618423], // Москва по умолчанию
  zoom = 10,
  onShopClick,
  className = ''
}: InteractiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined' || !window.L) {
      return
    }

    // Инициализируем карту
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = window.L.map(mapRef.current).setView(center, zoom)

      // Добавляем тайлы OpenStreetMap
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)
    }

    return () => {
      // Очистка при размонтировании
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Обновляем маркеры при изменении списка магазинов
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return

    // Удаляем старые маркеры
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker)
    })
    markersRef.current = []

    // Добавляем новые маркеры
    shops.forEach(shop => {
      const lat = parseFloat(shop.latitude)
      const lng = parseFloat(shop.longitude)

      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        const marker = window.L.marker([lat, lng])
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-gray-900">${shop.name}</h3>
              <p class="text-sm text-gray-600">${shop.address}</p>
              <p class="text-sm text-gray-600">${shop.city}</p>
              ${shop.phone ? `<p class="text-sm text-blue-600">${shop.phone}</p>` : ''}
            </div>
          `)

        // Добавляем обработчик клика
        if (onShopClick) {
          marker.on('click', () => onShopClick(shop))
        }

        markersRef.current.push(marker)
      }
    })

    // Центрируем карту по маркерам, если они есть
    if (shops.length > 0 && markersRef.current.length > 0) {
      const group = new window.L.featureGroup(markersRef.current)
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
    }
  }, [shops, onShopClick])

  // Обновляем центр и зум при изменении пропсов
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom)
    }
  }, [center, zoom])

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        className="w-full h-full min-h-[400px] rounded-lg"
        style={{ zIndex: 1 }}
      />

      {/* Fallback на случай, если Leaflet не загрузился */}
      {!window.L && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center p-8">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Интерактивная карта
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Загружается...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default InteractiveMap
