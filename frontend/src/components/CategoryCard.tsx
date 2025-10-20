import { motion } from 'framer-motion';
import { ChevronRight, Folder, Package } from 'lucide-react';

interface CategoryCardProps {
  id: string;
  name: string;
  productCount: number;
  hasSubcategories: boolean;
  onClick: () => void;
  index: number;
}

const CategoryCard = ({
  name,
  productCount,
  hasSubcategories,
  onClick,
  index
}: CategoryCardProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.05 * index,
        type: "spring",
        stiffness: 120
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* Gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent dark:from-gray-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      <div className="relative p-5 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center group-hover:bg-gray-900 dark:group-hover:bg-white transition-colors duration-200">
            {hasSubcategories ? (
              <Folder className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-white dark:group-hover:text-gray-900 transition-colors duration-200" />
            ) : (
              <Package className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-white dark:group-hover:text-gray-900 transition-colors duration-200" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-3 text-sm">
              {productCount > 0 && (
                <span className="text-gray-600 dark:text-gray-400">
                  {productCount} {productCount === 1 ? 'товар' : productCount < 5 ? 'товара' : 'товаров'}
                </span>
              )}
              {hasSubcategories && (
                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                  <Folder className="w-3.5 h-3.5" />
                  Есть подкатегории
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="flex-shrink-0 ml-4">
          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
        </div>
      </div>
    </motion.button>
  );
};

export default CategoryCard;

