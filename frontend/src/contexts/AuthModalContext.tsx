import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import AuthModal from '@/shared/ui/AuthModal'

interface AuthModalContextType {
  openAuthModal: () => void
  closeAuthModal: () => void
  isOpen: boolean
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

// Global handler that can be called from outside React components
let globalOpenAuthModal: (() => void) | null = null

export const openAuthModalGlobal = () => {
  if (globalOpenAuthModal) {
    globalOpenAuthModal()
  } else {
    console.warn('AuthModal is not initialized yet')
  }
}

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)

  const openAuthModal = () => setIsOpen(true)
  const closeAuthModal = () => setIsOpen(false)

  // Set global handler on mount
  useEffect(() => {
    globalOpenAuthModal = openAuthModal
    return () => {
      globalOpenAuthModal = null
    }
  }, [])

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal, isOpen }}>
      {children}
      <AuthModal isOpen={isOpen} onClose={closeAuthModal} />
    </AuthModalContext.Provider>
  )
}

export const useAuthModal = () => {
  const context = useContext(AuthModalContext)
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return context
}
