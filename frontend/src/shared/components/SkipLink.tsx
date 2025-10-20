import { motion } from 'framer-motion'

const SkipLink = () => {
  return (
    <motion.a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50"
      initial={{ opacity: 0, y: -50 }}
      whileFocus={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      Перейти к основному содержимому
    </motion.a>
  )
}

export default SkipLink
