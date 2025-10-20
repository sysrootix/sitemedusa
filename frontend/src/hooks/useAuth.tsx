import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { customToast } from '@/utils/toast';
import apiService, { User, TelegramAuthData } from '@/services/api';

interface PhoneAuthData {
  phone: string;
  code: string;
}

type AuthData = TelegramAuthData | PhoneAuthData;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (authData: AuthData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      // Try to verify token with the server
      // If cookies exist, server will validate them
      const { user: userData } = await apiService.verifyToken();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      // User is not authenticated or token expired
      // No need to show error toast on initial load
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (authData: AuthData): Promise<void> => {
    try {
      console.log('🔐 useAuth: Starting login process with data:', authData);
      setIsLoading(true);

      let response;

      // Check if it's phone auth (has phone and code properties)
      if ('phone' in authData && 'code' in authData) {
        console.log('📱 useAuth: Phone authentication detected');
        console.log('🌐 useAuth: Calling API verifyPhoneAuthCode');
        response = await apiService.verifyPhoneAuthCode(authData.phone, authData.code);
      } else {
        console.log('📱 useAuth: Telegram authentication detected');
        console.log('🌐 useAuth: Calling API telegramAuth');
        response = await apiService.telegramAuth(authData as TelegramAuthData);
      }

      console.log('✅ useAuth: Login successful, received response:', {
        user: response.user ? {
          id: response.user.id,
          first_name: response.user.first_name,
          username: response.user.username
        } : null,
        tokens: response.tokens ? 'present' : 'missing'
      });

      console.log('👤 useAuth: About to call setUser with:', response.user);
      setUser(response.user);
      console.log('✅ useAuth: User state updated, user is now:', response.user);

    } catch (error) {
      console.error('❌ useAuth: Login failed:', error);
      console.error('❌ useAuth: Error details:', error);
      customToast.error('Не удалось войти в аккаунт');
      throw error;
    } finally {
      setIsLoading(false);
      console.log('🔄 useAuth: Login process completed');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      customToast.error('Не удалось выйти из аккаунта');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      customToast.error('Не удалось обновить данные пользователя');
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export default useAuth;
