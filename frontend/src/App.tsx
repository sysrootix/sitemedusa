import { Routes, Route, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import CatalogHierarchical from './pages/CatalogHierarchical'
import CatalogHierarchicalV2 from './pages/CatalogHierarchicalV2'
import Articles from './pages/Articles'
import About from './pages/About'
import Contact from './pages/Contact'
import Shops from './pages/Shops'
import Profile from './pages/Profile'
import Vacancies from './pages/Vacancies'
import BonusSystem from './pages/BonusSystem'
import Promotions from './pages/Promotions'
import TelegramAuthHandler from './pages/TelegramAuthHandler'
import { ScrollToTop } from './shared/components'
import { AuthProvider } from './hooks/useAuth'
import { HomeBlocksProvider } from './hooks/useHomeBlocks'
import { CartProvider } from './contexts/CartContext'
import { FavoritesProvider } from './contexts/FavoritesContext'

function LayoutWrapper() {
  return (
    <Layout>
      <ScrollToTop />
      <Outlet />
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <HomeBlocksProvider>
            <Routes>
              <Route path="/auth/telegram-handler" element={<TelegramAuthHandler />} />
              <Route path="/" element={<LayoutWrapper />}>
                <Route index element={<Home />} />
                <Route path="catalog/*" element={<CatalogHierarchicalV2 />} />
                <Route path="catalog-v1" element={<CatalogHierarchical />} />
                <Route path="catalog-old" element={<Catalog />} />
                <Route path="shops" element={<Shops />} />
                <Route path="bonus-system" element={<BonusSystem />} />
                <Route path="promotions" element={<Promotions />} />
                <Route path="articles" element={<Articles />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="vacancies" element={<Vacancies />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Routes>
            <Toaster
              position="bottom-right"
              reverseOrder={false}
              gutter={8}
              toastOptions={{
                duration: 3000,
                className: 'toast-minimal',
                style: {
                  background: 'rgba(31, 41, 55, 0.95)',
                  color: '#f9fafb',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '12px 16px',
                  maxWidth: '350px',
                },
                success: {
                  duration: 2500,
                  style: {
                    background: 'rgba(31, 41, 55, 0.95)',
                    borderLeft: '3px solid #10b981',
                  },
                  iconTheme: {
                    primary: '#10b981',
                    secondary: 'rgba(31, 41, 55, 0.95)',
                  },
                },
                error: {
                  duration: 4000,
                  style: {
                    background: 'rgba(31, 41, 55, 0.95)',
                    borderLeft: '3px solid #ef4444',
                  },
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: 'rgba(31, 41, 55, 0.95)',
                  },
                },
                loading: {
                  style: {
                    background: 'rgba(31, 41, 55, 0.95)',
                    borderLeft: '3px solid #6b7280',
                  },
                  iconTheme: {
                    primary: '#6b7280',
                    secondary: 'rgba(31, 41, 55, 0.95)',
                  },
                },
              }}
              containerStyle={{
                bottom: '24px',
                right: '24px',
                zIndex: 99999,
              }}
              containerClassName="toast-container-minimal"
            />
          </HomeBlocksProvider>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
