import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  variant?: 'product-card' | 'category-card' | 'product-modal';
  count?: number;
}

const SkeletonLoader = ({ variant = 'product-card', count = 6 }: SkeletonLoaderProps) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'product-card') {
    return (
      <>
        {items.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Image skeleton */}
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse" />
            
            {/* Content skeleton */}
            <div className="p-4 md:p-5 space-y-3">
              {/* Rating */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
              
              {/* Title */}
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
              </div>
              
              {/* Price */}
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
              
              {/* Stock */}
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
              
              {/* Button */}
              <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            </div>
          </motion.div>
        ))}
      </>
    );
  }

  if (variant === 'category-card') {
    return (
      <>
        {items.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              
              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
              </div>
              
              {/* Arrow */}
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </motion.div>
        ))}
      </>
    );
  }

  if (variant === 'product-modal') {
    return (
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex gap-6">
          <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
          </div>
        </div>
        
        {/* Characteristics */}
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        
        {/* Shops */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;

