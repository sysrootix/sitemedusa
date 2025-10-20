import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { customToast } from '@/utils/toast';
import { openAuthModalGlobal } from '@/contexts/AuthModalContext';

// API Response interface
interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Additional interfaces
interface TelegramBot {
  id: number;
  username: string;
  first_name: string;
  last_name?: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author?: string;
  published_at: string;
  updated_at: string;
  tags?: string[];
  image_url?: string;
}

interface Shop {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  working_hours: string;
  latitude: string;
  longitude: string;
  description?: string;
  yandex_maps_url?: string;
  google_maps_url?: string;
  twogis_url?: string;
}

interface HomeBlock {
  id: 'hero' | 'why-choose-us' | 'popular-products' | 'bonus-program' | 'cta';
  order: number;
  isVisible: boolean;
  title: string;
  description: string;
}

interface ProductShopVariant {
  shop_code: string;
  shop_name: string;
  quantity: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  category_name?: string;
  retail_price?: number;
  characteristics?: any;
  modifications?: any;
  created_at: string;
  last_updated: string;
  shops: ProductShopVariant[];
  total_quantity: number;
  min_price: number;
  max_price: number;
}

interface Category {
  name: string;
  count: number;
}

interface ProductDetail {
  id: string;
  name: string;
  category_name?: string;
  category_id?: string;
  retail_price?: number;
  quanty?: number;
  characteristics?: any;
  modifications?: any;
  shop_name?: string;
  shop_code: string;
  created_at: string;
  last_updated: string;
}

interface ProductVariant {
  id: string;
  shop_code: string;
  shop_name: string;
  quanty: number;
  retail_price: number;
}

interface CatalogFilters {
  category?: string;
  shop?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

interface CatalogSort {
  field: 'name' | 'price' | 'created_at' | 'popularity';
  order: 'asc' | 'desc';
}

interface CatalogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// User interfaces
interface User {
  id: string;
  telegram_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  birthdate?: string;
  gender?: string;
  age?: number;
  language_code?: string;
  is_premium?: boolean;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  consent_personal_data?: boolean;
  consent_marketing?: boolean;
  photo_url?: string;
  allows_write_to_pm?: boolean;
  bonus?: number;
  status?: string;
  total_spent?: number;
  bonus_easter_egg?: boolean;
  has_seen_tour?: boolean;
  referral_code?: string;
  referred_by?: string;
  referral_bonus_received?: boolean;
  total_referrals?: number;
  position?: string;
  // Добавляем информацию о конфигурации статуса
  status_config?: {
    bonus_percent?: number;
    discount_multiplier?: number | string; // Может приходить как строка из API
    is_discount_only?: boolean;
    display_name?: string;
    emoji?: string;
  };
}

interface TelegramAuthData {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Phone auth interfaces
interface PhoneAuthRequest {
  phone: string;
}

interface PhoneCodeRequest {
  phone: string;
  code: string;
}

interface PhoneAuthResponse {
  sent: boolean;
  expiresIn: number;
}

// Purchase interfaces
interface PurchaseItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  bonus: number;
  discount: number;
}

interface Purchase {
  id: string;
  check_id: string;
  shopname: string;
  paymaster: string;
  user_phone: string;
  time_start: string;
  time_end: string;
  total_sum: number;
  created_at: string;
  bonus_added: number;
  bonus_spent: number;
  tickets_awarded: number;
  items: PurchaseItem[];
}

interface PurchaseHistoryResponse {
  purchases: Purchase[];
  total: number;
}

class ApiService {
  protected api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:55001/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Clean up old tokens from localStorage (migration from old auth system)
    if (localStorage.getItem('access_token') || localStorage.getItem('refresh_token')) {
      console.log('🧹 Cleaning up old tokens from localStorage...');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // No need to add auth token manually - cookies are sent automatically
        // with withCredentials: true

        // Add request ID for debugging
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (config.headers) {
          config.headers['X-Request-ID'] = requestId;
        }

        console.log(`🚀 API Request [${requestId}]:`, {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
        });

        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const requestId = response.config.headers?.['X-Request-ID'];
        console.log(`✅ API Response [${requestId}]:`, {
          status: response.status,
          data: response.data,
        });

        return response;
      },
      async (error: AxiosError<ApiResponse>) => {
        const requestId = error.config?.headers?.['X-Request-ID'];
        console.error(`❌ API Error [${requestId}]:`, {
          status: error.response?.status,
          message: error.response?.data?.message,
          errors: error.response?.data?.errors,
        });

        // Handle rate limit exceeded (429)
        if (error.response?.status === 429) {
          const message = error.response.data?.message || 'Ой, вы так быстро кликаете! 💨';
          const errors = error.response.data?.errors || ['Слишком много запросов. Пожалуйста, подождите немного и попробуйте снова.'];

          customToast.error(`${message}. ${errors.join('. ')}`, {
            duration: 5000,
          });

          return Promise.reject(error);
        }

        // Handle 401 errors (Unauthorized)
        if (error.response?.status === 401) {
          const requestMethod = (error.config?.method || 'get').toUpperCase();
          const requestUrl = (error.config?.url || '').replace(this.baseURL || '', '');
          const normalizedUrlRaw = requestUrl.startsWith('http') ? new URL(requestUrl).pathname : requestUrl;
          const normalizedUrl = normalizedUrlRaw.startsWith('/') ? normalizedUrlRaw : `/${normalizedUrlRaw}`;
          const headers = (error.config?.headers || {}) as Record<string, string>;
          const skipAuthModalHeader = headers['X-Skip-Auth-Modal'] === 'true' || headers['x-skip-auth-modal'] === 'true';
          const skipAuthModalPaths = ['/auth/verify', '/auth/me'];
          const skipAuthModal = skipAuthModalHeader || skipAuthModalPaths.some(path => normalizedUrl.startsWith(path));

          // If token is expired, try to refresh
          if (error.response?.data?.message?.includes('expired')) {
            try {
              await this.refreshToken();
              // Retry the original request
              // Cookies with refreshed token will be sent automatically
              if (error.config) {
                return this.api.request(error.config);
              }
            } catch (refreshError) {
              // Refresh failed, open auth modal
              this.clearTokens();
              if (!skipAuthModal) {
                openAuthModalGlobal();
              }
              return Promise.reject(error);
            }
          } else if (!skipAuthModal) {
            // For other 401 errors, open auth modal instead of showing toast
            openAuthModalGlobal();
          }

          return Promise.reject(error);
        }

        // Handle server errors (502, 503, 504, etc.)
        const response = error.response;
        if (response?.status && response.status >= 500) {
          const statusMessages: { [key: number]: string } = {
            500: 'Внутренняя ошибка сервера',
            502: 'Сервер временно недоступен',
            503: 'Сервис временно недоступен',
            504: 'Превышено время ожидания ответа от сервера'
          };

          const message = statusMessages[response.status] || 'Ошибка сервера';

          customToast.error(`${message}. Пожалуйста, попробуйте позже`, {
            icon: '⚠️',
            duration: 6000,
          });

          return Promise.reject(error);
        }

        // Handle other client errors
        if (response?.status && response.status >= 400 && response.status < 500) {
          const message = response.data?.message || 'Ошибка запроса';

          customToast.error(message, {
            icon: '❌',
            duration: 5000,
          });

          return Promise.reject(error);
        }

        // Handle network errors
        if (!error.response) {
          customToast.error('Проблемы с подключением. Проверьте интернет-соединение', {
            icon: '📡',
            duration: 5000,
          });

          return Promise.reject(error);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Store tokens
   * Note: Tokens are automatically stored in HTTP-only cookies by the server
   * We don't need to manually store them in localStorage anymore
   */
  private storeTokens(): void {
    // Tokens are stored in HTTP-only cookies by the server
    // No need to store in localStorage for security reasons
    console.log('✅ Tokens stored in HTTP-only cookies by server');
  }

  /**
   * Clear stored tokens
   * Note: Cookies are cleared by the server on logout
   */
  private clearTokens(): void {
    // Cookies are cleared by the server on logout
    console.log('✅ Tokens will be cleared by server');
  }

  // Auth API methods
  async telegramAuth(authData: TelegramAuthData): Promise<AuthResponse> {
    const response = await this.api.post<ApiResponse<AuthResponse>>('/auth/telegram', authData);
    
    if (response.data.success && response.data.data) {
      this.storeTokens();
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Authentication failed');
  }

  async refreshToken(): Promise<void> {
    const response = await this.api.post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>('/auth/refresh');

    if (response.data.success && response.data.data) {
      this.storeTokens();
    } else {
      throw new Error(response.data.message || 'Token refresh failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed, but clearing tokens anyway');
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<ApiResponse<User>>('/auth/me');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to get user profile');
  }

  async verifyToken(): Promise<{ user: User; tokenExpiration: string | null }> {
    const response = await this.api.get<ApiResponse<{ user: User; tokenExpiration: string | null }>>('/auth/verify', {
      headers: {
        'X-Skip-Auth-Modal': 'true',
      },
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Token verification failed');
  }

  async getTelegramStatus(): Promise<{ configured: boolean; bot: TelegramBot | null }> {
    const response = await this.api.get<ApiResponse<{ configured: boolean; bot: TelegramBot | null }>>('/auth/telegram/status');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get Telegram status');
  }

  async sendPhoneAuthCode(phone: string): Promise<{ sent: boolean; expiresIn: number }> {
    const response = await this.api.post<ApiResponse<{ sent: boolean; expiresIn: number }>>('/auth/phone/send-code', {
      phone,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to send authentication code');
  }

  async verifyPhoneAuthCode(phone: string, code: string): Promise<AuthResponse> {
    const response = await this.api.post<ApiResponse<AuthResponse>>('/auth/phone/verify-code', {
      phone,
      code,
    });

    if (response.data.success && response.data.data) {
      this.storeTokens();
      return response.data.data;
    }

    throw new Error(response.data.message || 'Authentication failed');
  }

  // User API methods
  async updateProfile(userId: string, updateData: Partial<User>): Promise<User> {
    const response = await this.api.put<ApiResponse<{ user: User }>>(`/users/${userId}`, updateData);
    
    if (response.data.success && response.data.data) {
      return response.data.data.user;
    }
    
    throw new Error(response.data.message || 'Failed to update profile');
  }

  async getUserProfile(userId: string): Promise<User> {
    const response = await this.api.get<ApiResponse<{ user: User }>>(`/users/${userId}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data.user;
    }
    
    throw new Error(response.data.message || 'Failed to get user profile');
  }

  async deleteAccount(userId: string): Promise<void> {
    const response = await this.api.delete<ApiResponse>(`/users/${userId}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete account');
    }
  }

  // System API methods
  async getHealthStatus(): Promise<Record<string, unknown>> {
    const response = await this.api.get<ApiResponse>('/health');

    if (response.data.success && response.data.data) {
      return response.data.data as Record<string, unknown>;
    }
    
    throw new Error('Health check failed');
  }

  // Articles API methods
  async getArticles(params?: { page?: number; limit?: number; query?: string; category_id?: string }) {
    const response: AxiosResponse<ApiResponse<{ articles: Article[] }>> = await this.api.get('/articles', { params });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch articles');
    }
    return {
      articles: response.data.data?.articles || [],
      meta: response.data.meta,
    };
  }

  async getArticleBySlug(slug: string) {
    const response: AxiosResponse<ApiResponse<Article>> = await this.api.get(`/articles/${slug}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch article');
    }
    return response.data.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    // With HTTP-only cookies, we can't check authentication status from JS
    // The server validates the cookie on each request
    // This method is deprecated but kept for backwards compatibility
    // Use the auth context (useAuth hook) to check authentication status instead
    console.warn('isAuthenticated() is deprecated when using HTTP-only cookies. Use useAuth hook instead.');
    return false; // Cannot determine from client-side, always check with server
  }

  getAuthHeaders(): { Authorization: string } | Record<string, never> {
    // No need to manually add Authorization header
    // Cookies are sent automatically with withCredentials: true
    return {} as Record<string, never>;
  }

  // Get user purchase history
  async getPurchaseHistory(): Promise<PurchaseHistoryResponse> {
    const response: AxiosResponse<ApiResponse<PurchaseHistoryResponse>> = await this.api.get('/auth/purchases');
    return response.data.data!;
  }

  // Get user avatar from Telegram
  async getUserAvatar(): Promise<{photo_url: string; file_id: string; file_path: string}> {
    const response: AxiosResponse<ApiResponse<{photo_url: string; file_id: string; file_path: string}>> = await this.api.get('/auth/avatar');
    return response.data.data!;
  }

  // Shops API methods
  async getShops(params?: { city?: string }) {
    const response: AxiosResponse<ApiResponse<{ shops: Shop[] }>> = await this.api.get('/shops', { params });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch shops');
    }
    return response.data.data?.shops || [];
  }

  async getShopCities() {
    const response: AxiosResponse<ApiResponse<{ cities: string[] }>> = await this.api.get('/shops/cities');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch cities');
    }
    return response.data.data?.cities || [];
  }

  // Home blocks API methods
  async getHomeBlocksConfig(): Promise<{ blocks: HomeBlock[] }> {
    const response: AxiosResponse<ApiResponse<{ blocks: HomeBlock[] }>> = await this.api.get('/home/blocks');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch home blocks config');
    }
    return response.data.data!;
  }

  async updateHomeBlocksConfig(config: { blocks: HomeBlock[] }): Promise<{ blocks: HomeBlock[] }> {
    const response: AxiosResponse<ApiResponse<{ blocks: HomeBlock[] }>> = await this.api.put('/home/blocks', config);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update home blocks config');
    }
    return response.data.data!;
  }

  // Catalog API methods
  async getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    shop?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: CatalogSort['field'];
    sortOrder?: CatalogSort['order'];
  }) {
    const response: AxiosResponse<ApiResponse<{
      products: Product[];
      pagination: CatalogPagination;
    }>> = await this.api.get('/catalog', { params });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch products');
    }
    return response.data.data!;
  }

  async getProductCategories() {
    const response: AxiosResponse<ApiResponse<{ categories: Category[] }>> = await this.api.get('/catalog/categories');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch categories');
    }
    return response.data.data?.categories || [];
  }

  async searchProducts(query: string, limit?: number) {
    const response: AxiosResponse<ApiResponse<{ products: Product[] }>> = await this.api.get('/catalog/search', {
      params: { q: query, limit }
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to search products');
    }
    return response.data.data?.products || [];
  }

  async getProductById(id: string) {
    const response: AxiosResponse<ApiResponse<{
      product: {
        id: string;
        name: string;
        slug?: string;
        category_id?: string;
        characteristics?: any;
        modifications?: any;
      };
      shops: Array<{
        shop_code: string;
        slug?: string;
        quantity: number | null;
        price: number | null;
        available: boolean;
      }>;
      total_quantity: number;
      min_price: number;
      max_price: number;
    }>> = await this.api.get(`/catalog/products/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch product');
    }
    return response.data.data!;
  }

  async getProductBySlug(slug: string) {
    const response: AxiosResponse<ApiResponse<{
      product: {
        id: string;
        name: string;
        slug?: string;
        category_id?: string;
        characteristics?: any;
        modifications?: any;
      };
      shops: Array<{
        shop_code: string;
        slug?: string;
        shop_name: string;
        city: string;
        address: string;
        quantity: number | null;
        price: number | null;
        modifications?: any;
        available: boolean;
      }>;
      total_quantity: number;
      min_price: number;
      max_price: number;
    }>> = await this.api.get(`/catalog/products/slug/${slug}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch product');
    }
    return response.data.data!;
  }

  // Catalog Shops API methods (new structure with shop-based catalog)
  async getLegacyCatalogShops(params?: { city?: string }) {
    const response: AxiosResponse<ApiResponse<{ shops: Shop[] }>> = await this.api.get('/catalog-shops/shops', { params });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch catalog shops');
    }
    return response.data.data?.shops || [];
  }

  async getShopCatalog(shopCode: string) {
    const response: AxiosResponse<ApiResponse<{
      shop: Shop;
      categories: Array<{
        id: string | null;
        name: string;
        products: Product[];
      }>;
      total_products: number;
      total_categories: number;
    }>> = await this.api.get(`/catalog-shops/shops/${shopCode}/catalog`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch shop catalog');
    }
    return response.data.data!;
  }

  async searchCatalogProducts(query: string, shopCode?: string, limit?: number) {
    const response: AxiosResponse<ApiResponse<{
      products: Array<{
        id: string;
        name: string;
        category_name: string;
        modifications: any;
        shops: Array<{
          shop_code: string;
          shop_name: string;
          quantity: number;
          price: number;
        }>;
      }>;
      total: number;
    }>> = await this.api.get('/catalog-shops/search', {
      params: { q: query, shop_code: shopCode, limit }
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to search products');
    }
    return response.data.data!;
  }

  async syncShopCatalog(shopCode: string) {
    const response: AxiosResponse<ApiResponse> = await this.api.post(`/catalog-shops/shops/${shopCode}/sync`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to trigger catalog sync');
    }
    return response.data;
  }

  async syncAllCatalogs() {
    const response: AxiosResponse<ApiResponse> = await this.api.post('/catalog-shops/sync-all');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to trigger catalog sync');
    }
    return response.data;
  }

  // Category browsing API methods (new hierarchical structure)
  async getShopCategories(shopCode: string, parentId?: string | null) {
    const response: AxiosResponse<ApiResponse<{
      categories: Array<{
        id: string;
        name: string;
        parent_id: string | null;
        level: number;
        full_path: string | null;
        products_count: number;
        subcategories_count: number;
        quanty: number | null;
      }>;
      shop: Shop;
    }>> = await this.api.get(`/catalog-shops/shops/${shopCode}/categories`, {
      params: { parent_id: parentId }
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch categories');
    }
    return response.data.data!;
  }

  async getCategoryTree(shopCode: string) {
    const response: AxiosResponse<ApiResponse<{
      tree: Array<{
        id: string;
        name: string;
        parent_id: string | null;
        level: number;
        full_path: string | null;
        path_ids: string[];
        products_count: number;
      }>;
      shop: Shop;
    }>> = await this.api.get(`/catalog-shops/shops/${shopCode}/categories/tree`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch category tree');
    }
    return response.data.data!;
  }

  async getCategoryProducts(
    shopCode: string,
    categoryId: string,
    options?: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'ASC' | 'DESC';
    }
  ) {
    const response: AxiosResponse<ApiResponse<{
      products: Product[];
      category: any;
      shop: Shop;
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    }>> = await this.api.get(`/catalog-shops/shops/${shopCode}/categories/${categoryId}/products`, {
      params: options
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch category products');
    }
    return response.data.data!;
  }

  async getCategoryBreadcrumbs(shopCode: string, categoryId: string) {
    const response: AxiosResponse<ApiResponse<{
      breadcrumbs: Array<{
        id: string;
        name: string;
        level: number;
      }>;
      shop: Shop;
    }>> = await this.api.get(`/catalog-shops/shops/${shopCode}/categories/${categoryId}/breadcrumbs`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch breadcrumbs');
    }
    return response.data.data!;
  }

  // New hierarchical categories API methods
  async getHierarchicalCategories(params?: { parent_id?: string; shop_code?: string }) {
    const response: AxiosResponse<ApiResponse<{
      categories: Array<{
        id: string;
        shop_code: string;
        name: string;
        parent_id: string | null;
        level: number;
        full_path: string | null;
        product_count: number;
        has_subcategories: boolean;
        sort_order: number;
      }>;
    }>> = await this.api.get('/catalog/categories/hierarchy', { params });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch hierarchical categories');
    }
    return response.data.data!.categories;
  }

  async getCategoryByIdWithBreadcrumb(categoryId: string) {
    const response: AxiosResponse<ApiResponse<{
      category: {
        id: string;
        shop_code: string;
        name: string;
        parent_id: string | null;
        level: number;
        full_path: string | null;
        sort_order: number;
      };
      breadcrumb: Array<{
        id: string;
        name: string;
        level: number;
      }>;
    }>> = await this.api.get(`/catalog/categories/${categoryId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch category');
    }
    return response.data.data!;
  }

  async getProductsByCategoryId(categoryId: string, params?: {
    shop_code?: string;
    page?: number;
    limit?: number;
    group_by_name?: boolean;
    search?: string;
  }) {
    const response: AxiosResponse<ApiResponse<{
      products: Array<any>;
      pagination: CatalogPagination;
      mode: 'general' | 'shop';
    }>> = await this.api.get(`/catalog/categories/${categoryId}/products`, { params });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch products');
    }
    return response.data.data!;
  }

  async searchProductsGlobally(params?: {
    shop_code?: string;
    page?: number;
    limit?: number;
    search?: string;
    group_by_name?: boolean;
  }) {
    const response: AxiosResponse<ApiResponse<{
      products: Array<any>;
      pagination: CatalogPagination;
      mode: 'general' | 'shop';
    }>> = await this.api.get('/catalog/products/search', { params });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to search products');
    }
    return response.data.data!;
  }

  async getCatalogShops() {
    const response: AxiosResponse<ApiResponse<{
      shops: Array<{
        shop_code: string;
        shop_name: string;
        city: string;
        address: string;
        product_count: number;
      }>;
    }>> = await this.api.get('/catalog/shops');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch shops');
    }
    return response.data.data!.shops;
  }

  async getPopularProducts(limit?: number) {
    const response: AxiosResponse<ApiResponse<{
      products: Array<{
        id: string;
        name: string;
        category: string;
        total_sold: number;
        purchase_count: number;
        price: number;
        min_price: number;
        max_price: number;
        shop_code?: string;
        in_stock: boolean;
        stock_quantity: number;
      }>;
      period: string;
      timestamp: Date;
    }>> = await this.api.get('/catalog/products/popular/top', {
      params: { limit }
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch popular products');
    }
    return response.data.data!.products;
  }

  // Error handling helper
  handleApiError(error: unknown): string {
    // Check if it's an Axios error
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { errors?: string[]; message?: string } } };
      if (axiosError.response?.data?.errors && axiosError.response.data.errors.length > 0) {
        return axiosError.response.data.errors.join(', ');
      }

      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }
    }

    // Check if it's a standard Error
    if (error instanceof Error) {
      return error.message;
    }

    return 'Произошла неожиданная ошибка';
  }
}

// Export types
export type {
  TelegramAuthData,
  PhoneAuthResponse,
  Purchase,
  PurchaseItem,
  PurchaseHistoryResponse,
  User,
  AuthResponse,
  ApiResponse,
  PhoneAuthRequest,
  PhoneCodeRequest,
  Product,
  ProductShopVariant,
  Category,
  ProductDetail,
  ProductVariant,
  CatalogFilters,
  CatalogSort,
  CatalogPagination
};

// Extend ApiService class with cart methods
class ExtendedApiService extends ApiService {
  // Cart API methods
  async getCart() {
    const response: AxiosResponse<ApiResponse<{
      items: Array<{
        id: string;
        product: any;
        modification?: any;
        quantity: number;
        price: number;
        total: number;
        shop_code: string;
        created_at: Date;
      }>;
      total: number;
      count: number;
    }>> = await this.api.get('/cart');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get cart');
    }
    return response.data.data!;
  }

  async addToCart(data: {
    product_id: string;
    shop_code: string;
    price: number;
    modification_id?: string;
    quantity?: number;
  }) {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/cart', data);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add to cart');
    }
    return response.data.data!;
  }

  async updateCartItem(itemId: string, quantity: number) {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.patch(`/cart/${itemId}`, { quantity });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update cart item');
    }
    return response.data.data!;
  }

  async removeFromCart(itemId: string) {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/cart/${itemId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to remove from cart');
    }
    return response.data;
  }

  async clearCart() {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete('/cart');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to clear cart');
    }
    return response.data;
  }

  // Favorites API methods
  async getFavorites() {
    const response: AxiosResponse<ApiResponse<{
      items: Array<{
        id: string;
        product_id: string;
        product_name: string;
        product_data: any;
        created_at: Date;
      }>;
      count: number;
    }>> = await this.api.get('/favorites');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get favorites');
    }
    return response.data.data!;
  }

  async addToFavorites(data: {
    product_id: string;
    product_name: string;
    product_data?: any;
  }) {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post('/favorites', data);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add to favorites');
    }
    return response.data.data!;
  }

  async removeFromFavorites(productId: string) {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete(`/favorites/${productId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to remove from favorites');
    }
    return response.data;
  }

  async clearFavorites() {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.delete('/favorites');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to clear favorites');
    }
    return response.data;
  }

  async checkFavorite(productId: string) {
    const response: AxiosResponse<ApiResponse<{ is_favorite: boolean }>> = await this.api.get(`/favorites/check/${productId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to check favorite');
    }
    return response.data.data!;
  }
}

// Export singleton instance
export default new ExtendedApiService();
