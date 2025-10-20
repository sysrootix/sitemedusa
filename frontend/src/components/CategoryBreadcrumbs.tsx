import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  id: string;
  name: string;
  level: number;
  full_path?: string | null;
}

interface CategoryBreadcrumbsProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigate: (categoryId: string | null, categoryPath?: string | null) => void;
  className?: string;
}

const CategoryBreadcrumbs = ({ breadcrumbs, onNavigate, className = '' }: CategoryBreadcrumbsProps) => {
  return (
    <nav aria-label="breadcrumb" className={`flex items-center gap-2 ${className}`}>
      {/* Home button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Вернуться к корневым категориям"
      >
        <Home className="w-4 h-4" />
        <span>Все категории</span>
      </motion.button>

      {breadcrumbs.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600" />
          
          {index === breadcrumbs.length - 1 ? (
            // Current category (not clickable)
            <span className="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white rounded-lg bg-gray-100 dark:bg-gray-800">
              {item.name}
            </span>
          ) : (
            // Parent categories (clickable)
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate(item.id, item.full_path)}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {item.name}
            </motion.button>
          )}
        </div>
      ))}
    </nav>
  );
};

export default CategoryBreadcrumbs;

