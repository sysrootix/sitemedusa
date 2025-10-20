import { createContext, useContext, useEffect, ReactNode } from 'react'

type Theme = 'dark'

interface ThemeContextType {
  theme: Theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const theme: Theme = 'dark'

  useEffect(() => {
    const root = window.document.documentElement

    // Убираем предыдущий класс темы
    root.classList.remove('light', 'dark')

    // Добавляем темную тему
    root.classList.add(theme)

    // Сохраняем в localStorage
    localStorage.setItem('medusa-theme', theme)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
