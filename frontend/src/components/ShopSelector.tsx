import { motion } from 'framer-motion';
import { Store, Globe, Search } from 'lucide-react';
import { useState } from 'react';

interface Shop {
  shop_code: string;
  shop_name: string;
  city: string;
  address: string;
  product_count: number;
}

interface ShopSelectorProps {
  shops: Shop[];
  selectedShop: string | null;
  onSelectShop: (shopCode: string | null) => void;
  className?: string;
}

const ShopSelector = ({ shops, selectedShop, onSelectShop, className = '' }: ShopSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredShops = shops.filter(shop => 
    shop.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        Выберите магазин
      </label>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск по названию, городу, адресу..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
        {/* All shops option */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelectShop(null)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
            selectedShop === null
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              selectedShop === null
                ? 'bg-blue-100 dark:bg-blue-800'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <Globe className={`w-5 h-5 ${
                selectedShop === null
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`} />
            </div>
            <div className="text-left">
              <div className="font-semibold">Все магазины</div>
              <div className="text-sm opacity-75">Товары из всех филиалов</div>
            </div>
          </div>
          {selectedShop === null && (
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </motion.button>

        {/* Individual shops in grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredShops.map((shop, index) => (
            <motion.button
              key={shop.shop_code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.03 * index }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectShop(shop.shop_code)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedShop === shop.shop_code
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                  selectedShop === shop.shop_code
                    ? 'bg-blue-100 dark:bg-blue-800'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <Store className={`w-4 h-4 ${
                    selectedShop === shop.shop_code
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-1 truncate">{shop.shop_name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                    📍 {shop.city}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 mb-1.5">
                    {shop.address}
                  </div>
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {shop.product_count} товаров
                  </div>
                </div>
                {selectedShop === shop.shop_code && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {filteredShops.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Магазины не найдены
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopSelector;
