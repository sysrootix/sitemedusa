import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, Check, ArrowDown, ArrowUp, ArrowDownAZ } from 'lucide-react';
import { useState } from 'react';

export interface FilterOptions {
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
  sortBy: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | null;
}

interface CatalogFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  productCount: number;
}

const CatalogFilters = ({ filters, onFiltersChange, productCount }: CatalogFiltersProps) => {
  const [isOpen, setIsOpen] = useState(true); // Открыты по умолчанию

  const handleMinPriceChange = (value: string) => {
    const price = value === '' ? null : Number(value);
    onFiltersChange({ ...filters, minPrice: price });
  };

  const handleMaxPriceChange = (value: string) => {
    const price = value === '' ? null : Number(value);
    onFiltersChange({ ...filters, maxPrice: price });
  };

  const toggleInStock = () => {
    onFiltersChange({ ...filters, inStockOnly: !filters.inStockOnly });
  };

  const handleSortChange = (sort: FilterOptions['sortBy']) => {
    onFiltersChange({ ...filters, sortBy: sort });
  };

  const resetFilters = () => {
    onFiltersChange({
      minPrice: null,
      maxPrice: null,
      inStockOnly: false,
      sortBy: null,
    });
  };

  const hasActiveFilters = filters.minPrice !== null || filters.maxPrice !== null || filters.inStockOnly || filters.sortBy !== null;

  // Quick filter options with icons
  const quickSortOptions = [
    { value: 'price-asc' as const, label: 'Дешевле', Icon: ArrowDown },
    { value: 'price-desc' as const, label: 'Дороже', Icon: ArrowUp },
    { value: 'name-asc' as const, label: 'А-Я', Icon: ArrowDownAZ },
  ];

  return (
    <div>
      {/* Quick filters - Always visible */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Stock filter chip */}
        <button
          onClick={toggleInStock}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            filters.inStockOnly
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-2 border-gray-900 dark:border-white'
              : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-white'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>В наличии</span>
        </button>

        {/* Quick sort chips */}
        {quickSortOptions.map((option) => {
          const Icon = option.Icon;
          return (
            <button
              key={option.value}
              onClick={() => handleSortChange(filters.sortBy === option.value ? null : option.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filters.sortBy === option.value
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-2 border-gray-900 dark:border-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{option.label}</span>
            </button>
          );
        })}

        {/* Advanced filters toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            isOpen || hasActiveFilters
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-2 border-gray-900 dark:border-white'
              : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-white'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Цена</span>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs rounded-full font-bold">
              {[filters.minPrice, filters.maxPrice].filter(Boolean).length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-500 hover:text-red-500 transition-all"
          >
            <X className="w-4 h-4" />
            <span>Сбросить</span>
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Диапазон цен
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="От"
                  value={filters.minPrice ?? ''}
                  onChange={(e) => handleMinPriceChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <span className="text-gray-400 dark:text-gray-500 font-medium">—</span>
                <input
                  type="number"
                  placeholder="До"
                  value={filters.maxPrice ?? ''}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Product Count */}
              <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 text-center">
                Показано: <span className="font-bold text-purple-600 dark:text-purple-400">{productCount}</span> {productCount === 1 ? 'товар' : productCount < 5 ? 'товара' : 'товаров'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CatalogFilters;

