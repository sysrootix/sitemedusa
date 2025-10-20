import { motion } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Trophy, Zap } from 'lucide-react'
import { Modal } from '@/shared/ui'

interface Jellyfish {
  id: number
  x: number
  y: number
  speed: number
  direction: number
  size: number
  emoji: string
  rotation: number
  pulsePhase: number
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
  rotation?: number
}

const MiniGame = () => {
  const [showGameModal, setShowGameModal] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [showVictoryModal, setShowVictoryModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [score, setScore] = useState(0)
  const [jellyfishes, setJellyfishes] = useState<Jellyfish[]>([])
  const [timeLeft, setTimeLeft] = useState(45)
  const [particles, setParticles] = useState<Particle[]>([])
  const [combo, setCombo] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()

  const targetScore = 8 // Нужно поймать 8 морских существ

  const jellyfishEmojis = ['🪼', '🐙', '🐠', '🐟', '🌊', '💧', '🐳', '🦈', '🐬', '🐋']

  // Создание конфетти эффекта для победы
  const createConfetti = useCallback(() => {
    const confettiParticles: Particle[] = []
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f', '#bb8fce', '#85c1e9', '#ff9ff3', '#54a0ff']

    for (let i = 0; i < 50; i++) {
      confettiParticles.push({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: -10,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 3 + 2,
        life: 300,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 4,
        rotation: Math.random() * 360
      })
    }

    setParticles(prev => [...prev, ...confettiParticles])

    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.life > 100))
    }, 3000)
  }, [])

  // Создание частиц эффекта
  const createParticles = useCallback((x: number, y: number, count: number = 8) => {
    const newParticles: Particle[] = []
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f', '#bb8fce', '#85c1e9']

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const speed = Math.random() * 3 + 1
      newParticles.push({
        id: Date.now() + i,
        x: x + Math.cos(angle) * 20,
        y: y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60, // 60 кадров жизни
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2
      })
    }

    setParticles(prev => [...prev, ...newParticles])

    // Удаляем старые частицы через 2 секунды
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id > Date.now() - 2000))
    }, 2000)
  }, [])

  // Инициализация игры
  const startGame = useCallback(() => {
    setGameStarted(true)
    setScore(0)
    setTimeLeft(45)
    setGameCompleted(false)
    setCombo(0)
    setParticles([])

    // Создаем морских существ с улучшенными свойствами
    const initialJellyfishes: Jellyfish[] = []
    for (let i = 0; i < 4; i++) {
      initialJellyfishes.push({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        speed: Math.random() * 0.4 + 0.15,
        direction: Math.random() * Math.PI * 2,
        size: Math.random() * 0.4 + 0.8,
        emoji: jellyfishEmojis[Math.floor(Math.random() * jellyfishEmojis.length)],
        rotation: Math.random() * 360,
        pulsePhase: Math.random() * Math.PI * 2
      })
    }
    setJellyfishes(initialJellyfishes)
  }, [jellyfishEmojis])

  // Таймер
  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !gameCompleted) {
      setGameStarted(false)
    }
  }, [gameStarted, timeLeft, gameCompleted])

  // Анимация частиц
  useEffect(() => {
    if (particles.length === 0) return

    const animateParticles = () => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vx: particle.vx * 0.99, // Легкое замедление
        vy: particle.vy + 0.05, // Гравитация
        rotation: (particle.rotation || 0) + 5, // Вращение
        life: particle.life - 1
      })).filter(particle => particle.life > 0))

      animationFrameRef.current = requestAnimationFrame(animateParticles)
    }

    animationFrameRef.current = requestAnimationFrame(animateParticles)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [particles])

  // Движение медуз
  useEffect(() => {
    if (!gameStarted || gameCompleted) return

    const interval = setInterval(() => {
      setJellyfishes(prev =>
        prev.map(jellyfish => {
          let newX = jellyfish.x + Math.cos(jellyfish.direction) * jellyfish.speed
          let newY = jellyfish.y + Math.sin(jellyfish.direction) * jellyfish.speed
          let newDirection = jellyfish.direction

          // Отскок от границ
          if (newX <= 5 || newX >= 95) {
            newDirection = Math.PI - newDirection
            newX = Math.max(5, Math.min(95, newX))
          }
          if (newY <= 10 || newY >= 90) {
            newDirection = -newDirection
            newY = Math.max(10, Math.min(90, newY))
          }

          return {
            ...jellyfish,
            x: newX,
            y: newY,
            direction: newDirection
          }
        })
      )
    }, 50)

    return () => clearInterval(interval)
  }, [gameStarted, gameCompleted])

  // Клик на морское существо
  const handleJellyfishClick = useCallback((id: number, clickX: number, clickY: number) => {
    if (!gameStarted || gameCompleted) return

    const now = Date.now()
    const timeSinceLastClick = now - lastClickTime
    const isCombo = timeSinceLastClick < 1000 // 1 секунда для комбо

    setLastClickTime(now)
    setCombo(prev => isCombo ? prev + 1 : 1)

    // Создаем частицы эффекта
    createParticles(clickX, clickY, isCombo ? 12 : 8)

    setJellyfishes(prev => prev.filter(j => j.id !== id))
    setScore(prev => prev + 1)

    // Добавляем новое морское существо
    const newJellyfish: Jellyfish = {
      id: Date.now(),
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      speed: Math.random() * 0.4 + 0.15,
      direction: Math.random() * Math.PI * 2,
      size: Math.random() * 0.4 + 0.8,
      emoji: jellyfishEmojis[Math.floor(Math.random() * jellyfishEmojis.length)],
      rotation: Math.random() * 360,
      pulsePhase: Math.random() * Math.PI * 2
    }

    setJellyfishes(prev => [...prev, newJellyfish])

    // Проверка победы
    if (score + 1 >= targetScore) {
      setGameCompleted(true)
      setGameStarted(false)
      // Создаем конфетти эффект
      setTimeout(() => createConfetti(), 500)
      // Закрываем игровое модальное окно и показываем окно победы
      setTimeout(() => {
        setShowGameModal(false)
        setShowVictoryModal(true)
      }, 1000)
    }
  }, [gameStarted, gameCompleted, score, lastClickTime, createParticles, jellyfishEmojis])

  const generatePromoCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = 'MEDUSA'
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const [promoCode] = useState(generatePromoCode())

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(promoCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }, [promoCode])

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="w-full py-12 sm:py-16"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Game Card */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          whileHover={{ y: -1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 p-8 lg:p-12">
            {/* Content */}
            <div className="flex flex-col justify-center">
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">
                🎮 Мини-игра
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Морской патруль
              </h2>

              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Соберите {targetScore} морских существ и получите скидку 10% на весь ассортимент товаров
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowGameModal(true)}
                className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                🎮 Играть сейчас
              </motion.button>
            </div>

            {/* Image Placeholder */}
            <div className="flex items-center justify-center">
              <div className="w-full h-64 lg:h-80 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">🪼🐠🐟</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Место для картинки
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )

  return (
    <>
      {content}

      {/* Game Modal */}
      <Modal
        isOpen={showGameModal}
        onClose={() => {
          setShowGameModal(false)
          setGameStarted(false)
          setGameCompleted(false)
          setScore(0)
          setTimeLeft(45)
          setJellyfishes([])
        }}
        size="xl"
      >
        <div className="p-6">
          {/* Game Stats */}
          {gameStarted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200/30 dark:border-purple-700/30 relative overflow-hidden"
            >
              {/* Фоновый эффект для комбо */}
              {combo > 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-2xl"
                />
              )}

              <div className="flex items-center gap-2 relative z-10">
                <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Счет: <span className="text-purple-600 dark:text-purple-400 font-bold">{score}/{targetScore}</span>
                </span>
              </div>

              <div className="flex items-center gap-4 relative z-10">
                {combo > 1 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1"
                  >
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                      x{combo}
                    </span>
                  </motion.div>
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Время: <span className="text-purple-600 dark:text-purple-400 font-bold">{timeLeft}с</span>
                </span>
              </div>
            </motion.div>
          )}

          {/* Game Area */}
          <div
            ref={gameAreaRef}
            className="relative w-full h-80 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-3xl border border-purple-200/30 dark:border-purple-700/30 overflow-hidden mb-6 shadow-inner"
          >

            {/* Декоративные волны фона */}
            <div className="absolute inset-0 opacity-10">
              <motion.div
                animate={{
                  x: [-100, 100, -100],
                  y: [-50, 50, -50]
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute top-10 left-10 w-32 h-32 bg-purple-300/20 rounded-full blur-xl"
              />
              <motion.div
                animate={{
                  x: [100, -100, 100],
                  y: [50, -50, 50]
                }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
                className="absolute bottom-10 right-10 w-40 h-40 bg-pink-300/20 rounded-full blur-xl"
              />
              <motion.div
                animate={{
                  x: [-50, 50, -50],
                  y: [30, -30, 30]
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-300/20 rounded-full blur-xl"
              />
            </div>

            {/* Start Screen */}
            {!gameStarted && !gameCompleted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-8"
              >
                <div className="text-center max-w-md">
                  <div className="text-5xl mb-6">
                    🪼🐠🐟
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Морской патруль
                  </h3>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Кликайте на морских существ</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">У вас 45 секунд</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Цель: собрать {targetScore} существ</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startGame}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200"
                  >
                    🎮 Начать игру
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Game Over Screen */}
            {timeLeft === 0 && !gameCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-3xl"
              >
                <motion.div
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="text-5xl mb-3"
                >
                  ⏰
                </motion.div>
                <div className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                  Время вышло!
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                  Спасено: {score}/{targetScore} морских существ
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
                >
                  Попробовать снова
                </motion.button>
              </motion.div>
            )}


            {/* Jellyfishes */}
            {gameStarted && !gameCompleted && jellyfishes.map((jellyfish) => (
              <motion.button
                key={jellyfish.id}
                className="absolute cursor-pointer focus:outline-none group"
                style={{
                  left: `${jellyfish.x}%`,
                  top: `${jellyfish.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={(e) => {
                  const rect = gameAreaRef.current?.getBoundingClientRect()
                  if (rect) {
                    const x = e.clientX - rect.left
                    const y = e.clientY - rect.top
                    handleJellyfishClick(jellyfish.id, x, y)

                    // Визуальная обратная связь - вибрация на мобильных
                    if ('vibrate' in navigator) {
                      navigator.vibrate(50)
                    }
                  } else {
                    handleJellyfishClick(jellyfish.id, 0, 0)
                  }
                }}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.7 }}
              >
                <motion.div
                  animate={{
                    y: [-4, 4, -4],
                    rotate: [jellyfish.rotation, jellyfish.rotation + 10, jellyfish.rotation],
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 4 + jellyfish.speed * 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-3xl filter drop-shadow-lg group-hover:drop-shadow-2xl group-hover:brightness-110 transition-all duration-300"
                  style={{
                    fontSize: `${2 * jellyfish.size}rem`,
                    filter: `hue-rotate(${jellyfish.rotation}deg) brightness(1.1)`
                  }}
                >
                  {jellyfish.emoji}
                </motion.div>

                {/* Свечение при наведении */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  whileHover={{ opacity: 1, scale: 1.5 }}
                  className="absolute inset-0 rounded-full bg-purple-400/30 blur-xl"
                />
              </motion.button>
            ))}

            {/* Particles */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${particle.x}px`,
                  top: `${particle.y}px`,
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  borderRadius: particle.id > Date.now() - 1000 ? '50%' : '2px', // Конфетти квадратное, обычные частицы круглые
                  transform: `rotate(${particle.rotation || 0}deg)`
                }}
                initial={{ opacity: 1, scale: 1 }}
                animate={{
                  opacity: particle.life / (particle.id > Date.now() - 1000 ? 300 : 60),
                  scale: particle.life / (particle.id > Date.now() - 1000 ? 300 : 60),
                  rotate: (particle.rotation || 0) + 360
                }}
                transition={{ duration: 3, ease: "linear" }}
              />
            ))}

            {/* Progress Bar */}
            {gameStarted && (
              <motion.div
                className="absolute bottom-4 left-4 right-4 h-2 bg-white/30 dark:bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-full shadow-lg"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timeLeft / 45) * 100}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </motion.div>
            )}
          </div>

          {/* Controls */}
          {gameStarted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setGameStarted(false)
                  setGameCompleted(false)
                  setScore(0)
                  setTimeLeft(45)
                  setJellyfishes([])
                }}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200"
              >
                Остановить
              </motion.button>
            </motion.div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showVictoryModal}
        onClose={() => setShowVictoryModal(false)}
        size="xl"
      >
        <div className="text-center py-6 sm:py-8 px-4">
          <div className="text-4xl sm:text-5xl lg:text-6xl mb-6 relative">
            <span className="filter drop-shadow-lg">🎉</span>
            <span className="absolute -top-2 -right-2 text-xl sm:text-2xl">
              🏆
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center"
          >
            Миссия выполнена! 🎊
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-base sm:text-lg text-gray-600 dark:text-gray-400 text-center mb-8 max-w-md mx-auto px-2"
          >
            Вы стали настоящим Морским Патрульным!<br/>
            Вот ваш персональный промокод на скидку 10%
          </motion.div>

          {/* Promo Code */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mx-auto max-w-sm w-full shadow-lg"
          >
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                🎁 ЭКСКЛЮЗИВНЫЙ ПРОМОКОД 🎁
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-gray-900 dark:text-white mb-2 break-all">
                  {promoCode}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  -10% на весь ассортимент
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Действителен во всех магазинах Medusa
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={copyToClipboard}
                className={`w-full py-2.5 px-4 rounded-lg border font-medium text-sm transition-all duration-200 ${
                  copied
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {copied ? '✓ Скопировано' : '📋 Скопировать'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </Modal>
    </>
  )
}

export default MiniGame

