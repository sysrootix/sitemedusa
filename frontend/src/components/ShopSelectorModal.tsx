import { motion, AnimatePresence } from 'framer-motion';
import { Store, Globe, Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Shop {
  shop_code: string;
  shop_name: string;
  city: string;
  address: string;
  product_count: number;
}

interface ShopSelectorModalProps {
  shops: Shop[];
  selectedShop: string | null;
  onSelectShop: (shopCode: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ShopSelectorModal = ({ shops, selectedShop, onSelectShop, isOpen, onClose }: ShopSelectorModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleShopSelect = (shopCode: string | null) => {
    onSelectShop(shopCode);
    onClose();
    setSearchQuery(''); // Reset search on close
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const filteredShops = shops.filter(shop => 
    shop.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Выберите магазин
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 md:px-6 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск по названию, городу, адресу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm md:text-base placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="space-y-3">
                {/* All shops option */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleShopSelect(null)}
                  className={`w-full flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl border-2 transition-all duration-200 ${
                    selectedShop === null
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center ${
                    selectedShop === null
                      ? 'bg-blue-100 dark:bg-blue-800'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Globe className={`w-6 h-6 md:w-7 md:h-7 ${
                      selectedShop === null
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-base md:text-lg">Все магазины</div>
                    <div className="text-sm md:text-base opacity-75">Товары из всех филиалов</div>
                  </div>
                  {selectedShop === null && (
                    <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </motion.button>

                {/* Individual shops in grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredShops.map((shop, index) => (
                    <motion.button
                      key={shop.shop_code}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.02 * index }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleShopSelect(shop.shop_code)}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedShop === shop.shop_code
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedShop === shop.shop_code
                            ? 'bg-blue-100 dark:bg-blue-800'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <Store className={`w-5 h-5 ${
                            selectedShop === shop.shop_code
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm md:text-base mb-1 flex items-center gap-1">
                            <span>📍</span>
                            <span className="truncate">{shop.city}</span>
                          </div>
                          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {shop.address}
                          </div>
                        </div>
                        {selectedShop === shop.shop_code && (
                          <div className="absolute top-3 right-3 w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {filteredShops.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    Магазины не найдены
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShopSelectorModal;

