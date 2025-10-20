import { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import { ScrollToTopButton } from '@/shared/components'
import SkipLink from '@/shared/components/SkipLink'
import AgeVerificationModal from './AgeVerificationModal'
import BonusRegistrationPrompt from './BonusRegistrationPrompt'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <SkipLink />
      <Header />
      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <ScrollToTopButton />
      <AgeVerificationModal />
      <BonusRegistrationPrompt />
    </div>
  )
}

export default Layout
