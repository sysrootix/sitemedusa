import { Router } from 'express';
import axios from 'axios';

const router = Router();

/**
 * Карты API - OpenStreetMap (бесплатный, без API ключа)
 *
 * Замена Яндекс.Карт на бесплатные сервисы:
 * - Статические карты: OpenStreetMap Static API
 * - Геокодирование: Nominatim (OpenStreetMap)
 * - Интерактивные карты: Leaflet с OpenStreetMap тайлами
 */

/**
 * Прокси для OpenStreetMap Static API (бесплатный, без API ключа)
 * Использует различные бесплатные сервисы для генерации статических карт
 */
router.get('/static', async (req, res) => {
  try {
    const {
      l = 'map', // Тип карты (map, satellite, hybrid, etc.)
      ll, // Координаты центра (longitude,latitude)
      z = 10, // Масштаб
      size = '400,300', // Размер изображения
      pt, // Метки на карте
      pl // Линии на карте
    } = req.query;

    // Приводим параметры к нужным типам с значениями по умолчанию
    const zoom = parseInt((Array.isArray(z) ? z[0] : z) as string) || 10;

    // Проверяем базовые параметры
    if (zoom < 1 || zoom > 18) {
      return res.status(400).json({
        success: false,
        message: 'Invalid zoom level',
        errors: ['Zoom must be between 1 and 18']
      });
    }

    console.log('🔍 [OpenStreetMap Static] Входящие параметры:', {
      l,
      ll,
      z,
      size,
      pt,
      pl
    });

    // Парсим координаты
    let centerLng = 37.618423; // Москва по умолчанию
    let centerLat = 55.751244;

    if (ll) {
      const coords = (Array.isArray(ll) ? ll[0] : ll) as string;
      const coordParts = coords.split(',');
      const lng = coordParts[0] ? parseFloat(coordParts[0].trim()) : 0;
      const lat = coordParts[1] ? parseFloat(coordParts[1].trim()) : 0;
      if (!isNaN(lng) && !isNaN(lat)) {
        centerLng = lng;
        centerLat = lat;
      }
    }

    // Парсим размер
    const sizeStr = (Array.isArray(size) ? size[0] : size) as string;
    const sizeParts = sizeStr.split(',');
    const widthStr = sizeParts[0];
    const heightStr = sizeParts[1];
    const width = widthStr ? parseInt(widthStr.trim()) || 400 : 400;
    const height = heightStr ? parseInt(heightStr.trim()) || 300 : 300;

    console.log('📍 [OpenStreetMap Static] Координаты и параметры:', {
      center: [centerLng, centerLat],
      size: [width, height],
      zoom,
      mapType: l
    });

    // Проверяем параметры
    if (width <= 0 || height <= 0 || width > 2000 || height > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid size parameters',
        errors: ['Size must be between 1x1 and 2000x2000 pixels']
      });
    }

    // Все проверки пройдены, продолжаем генерацию карты
    console.log('✅ [OpenStreetMap Static] Параметры валидны, начинаем генерацию карты');

    // Используем бесплатный сервис для генерации статических карт
    // Попробуем несколько сервисов в порядке приоритета

    let mapImageUrl = '';

    try {
      // 1. Попробуем OpenStreetMap Static Map (бесплатный)
      mapImageUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${centerLng - 0.01},${centerLat - 0.01},${centerLng + 0.01},${centerLat + 0.01}&layer=mapnik&marker=${centerLat},${centerLng}`;

      console.log('🗺️ [OpenStreetMap Static] Попытка использовать OpenStreetMap Static');

      // Для статических изображений используем другой подход
      // Используем сервис, который может генерировать статические изображения
      const staticUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLng}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik`;

      console.log('🌐 [OpenStreetMap Static] Сформированный URL:', staticUrl);

      const response = await axios.get(staticUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; YourApp/1.0)',
          'Accept': 'image/*',
        }
      });

      console.log('✅ [OpenStreetMap Static] Успешный ответ:', {
        status: response.status,
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length']
      });

      // Устанавливаем правильные заголовки
      res.set({
        'Content-Type': response.headers['content-type'] || 'image/png',
        'Cache-Control': 'public, max-age=3600', // Кешировать на 1 час
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });

      return res.send(response.data);

    } catch (osmError) {
      console.log('⚠️ [OpenStreetMap Static] OpenStreetMap сервис недоступен, пробуем альтернативу');

      // 2. Альтернативный сервис - Stamen Maps или другой бесплатный
      try {
        const altStaticUrl = `https://stamen-tiles.a.ssl.fastly.net/terrain/${zoom}/${Math.floor((centerLng + 180) / 360 * Math.pow(2, zoom))}/${Math.floor((1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))}.png`;

        console.log('🔄 [Alternative Maps] Попытка использовать альтернативный сервис');

        const response = await axios.get(altStaticUrl, {
          responseType: 'arraybuffer',
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; YourApp/1.0)',
            'Accept': 'image/*',
          }
        });

        res.set({
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        });

        return res.send(response.data);

      } catch (altError) {
        console.log('⚠️ [Alternative Maps] Альтернативный сервис тоже недоступен');
      }
    }

    // 3. Если ничего не работает, возвращаем fallback изображение
    console.log('🖼️ [Maps Fallback] Создание fallback изображения');

    // Создаем простое SVG изображение как fallback
    const svgFallback = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
          Карта временно недоступна
        </text>
        <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">
          Попробуйте позже
        </text>
        <circle cx="${width/2}" cy="${height/2}" r="5" fill="#ef4444"/>
      </svg>
    `;

    res.set({
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300', // Кешировать на 5 минут
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });

    res.send(svgFallback);

  } catch (error: any) {
    console.error('❌ [OpenStreetMap Static] Критическая ошибка:', error.message);

    // Возвращаем fallback SVG в случае любой ошибки
    const fallbackSvg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
          Ошибка загрузки карты
        </text>
        <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">
          Проверьте подключение к интернету
        </text>
      </svg>
    `;

    res.set({
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60', // Кешировать на 1 минуту
      'Access-Control-Allow-Origin': '*',
    });

    res.send(fallbackSvg);
    return;
  }

  // Это никогда не должно выполняться, но на всякий случай
  return;
});

/**
 * Получение информации о геокодировании (адрес по координатам)
 * Использует Nominatim API (OpenStreetMap) - бесплатный, без API ключа
 */
router.get('/geocode', async (req, res) => {
  try {
    const {
      ll, // Координаты (longitude,latitude)
      format = 'json'
    } = req.query;

    console.log('🔍 [OpenStreetMap Geocode] Входящие параметры:', {
      ll,
      format
    });

    // Проверяем базовые параметры
    if (!ll) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates are required',
        errors: ['ll parameter is required']
      });
    }

    // Парсим координаты
    const coords = (Array.isArray(ll) ? ll[0] : ll) as string;
    const coordParts = coords.split(',');
    const lngStr = coordParts[0];
    const latStr = coordParts[1];
    const lng = lngStr ? parseFloat(lngStr.trim()) : 0;
    const lat = latStr ? parseFloat(latStr.trim()) : 0;

    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates format',
        errors: ['Coordinates must be in format: longitude,latitude']
      });
    }

    // Используем Nominatim API (OpenStreetMap) для обратного геокодирования
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse`;

    const params = new URLSearchParams();
    params.append('format', 'json');
    params.append('lat', lat.toString());
    params.append('lon', lng.toString());
    params.append('addressdetails', '1');
    params.append('accept-language', 'ru,en');
    params.append('zoom', '18');

    const fullUrl = `${nominatimUrl}?${params.toString()}`;
    console.log('🌐 [OpenStreetMap Geocode] Сформированный URL:', fullUrl);

    console.log('📡 [OpenStreetMap Geocode] Отправка запроса к Nominatim API...');

    const response = await axios.get(fullUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YourApp/1.0)',
        'Accept': 'application/json',
      }
    });

    console.log('✅ [OpenStreetMap Geocode] Успешный ответ от Nominatim API:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers['content-type']
    });

    // Преобразуем ответ Nominatim в формат, похожий на Яндекс API
    const nominatimData: any = response.data;

    // Проверяем, что данные существуют и содержат необходимые поля
    if (!nominatimData || !nominatimData.display_name) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
        errors: ['No address found for these coordinates']
      });
    }

    const yandexCompatibleResponse = {
      response: {
        GeoObjectCollection: {
          metaDataProperty: {
            GeocoderResponseMetaData: {
              request: coords,
              results: 1,
              found: 1
            }
          },
          featureMember: [{
            GeoObject: {
              metaDataProperty: {
                GeocoderMetaData: {
                  precision: 'exact',
                  text: nominatimData.display_name || 'Адрес не найден',
                  kind: 'house'
                }
              },
              name: nominatimData.display_name || 'Адрес не найден',
              description: nominatimData.address ? Object.values(nominatimData.address).map(String).join(', ') : '',
              boundedBy: nominatimData.boundingbox && Array.isArray(nominatimData.boundingbox) ? {
                Envelope: {
                  lowerCorner: `${nominatimData.boundingbox[2]} ${nominatimData.boundingbox[0]}`,
                  upperCorner: `${nominatimData.boundingbox[3]} ${nominatimData.boundingbox[1]}`
                }
              } : undefined,
              Point: {
                pos: `${lng} ${lat}`
              }
            }
          }]
        }
      }
    };

    console.log('📤 [OpenStreetMap Geocode] Отправка данных клиенту');
    res.json(yandexCompatibleResponse);

  } catch (error: any) {
    console.error('❌ [OpenStreetMap Geocode] Ошибка при запросе к Nominatim API:', error.message);

    // Подробное логирование ошибки
    if (error.response) {
      console.error('📋 [OpenStreetMap Geocode] Детали ответа:', {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      });
    }

    let statusCode = 500;
    let errorMessage = 'Failed to geocode coordinates';

    if (error.response) {
      statusCode = error.response.status;
      if (error.response.status === 429) {
        errorMessage = 'Geocoding service rate limit exceeded. Please try again later.';
      }
    }

    console.log('🚨 [OpenStreetMap Geocode] Отправка ошибки клиенту:', {
      statusCode,
      errorMessage,
      originalError: error.message
    });

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      errors: [error.message]
    });
    return;
  }

  // Это никогда не должно выполняться, но на всякий случай
  return;
});

/**
 * Загрузка Leaflet CSS и JS для работы с OpenStreetMap (бесплатная альтернатива)
 * Не требует API ключа
 */
router.get('/leaflet-js', async (req, res) => {
  try {
    console.log('🔍 [Leaflet JS] Запрос на загрузку Leaflet JavaScript');

    // Загружаем Leaflet JavaScript
    const leafletJsUrl = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

    console.log('🌐 [Leaflet JS] Загрузка с URL:', leafletJsUrl);

    const response = await axios.get(leafletJsUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YourApp/1.0)',
        'Accept': 'application/javascript',
      }
    });

    console.log('✅ [Leaflet JS] Успешная загрузка:', {
      status: response.status,
      contentLength: response.headers['content-length']
    });

    res.set({
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=86400', // Кешировать на день
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });

    res.send(response.data);
    return;

  } catch (error: any) {
    console.error('❌ [Leaflet JS] Ошибка загрузки:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to load Leaflet JavaScript',
      errors: [error.message]
    });
    return;
  }

  // Это никогда не должно выполняться, но на всякий случай
  return;
});

/**
 * Загрузка Leaflet CSS
 */
router.get('/leaflet-css', async (req, res) => {
  try {
    console.log('🔍 [Leaflet CSS] Запрос на загрузку Leaflet CSS');

    const leafletCssUrl = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

    console.log('🌐 [Leaflet CSS] Загрузка с URL:', leafletCssUrl);

    const response = await axios.get(leafletCssUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YourApp/1.0)',
        'Accept': 'text/css',
      }
    });

    console.log('✅ [Leaflet CSS] Успешная загрузка:', {
      status: response.status,
      contentLength: response.headers['content-length']
    });

    res.set({
      'Content-Type': 'text/css',
      'Cache-Control': 'public, max-age=86400', // Кешировать на день
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });

    res.send(response.data);
    return;

  } catch (error: any) {
    console.error('❌ [Leaflet CSS] Ошибка загрузки:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to load Leaflet CSS',
      errors: [error.message]
    });
    return;
  }

  // Это никогда не должно выполняться, но на всякий случай
  return;
});

export default router;
