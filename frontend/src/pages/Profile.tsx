import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { customToast } from '@/utils/toast';
import {
  User,
  Edit3,
  Save,
  X,
  Calendar,
  Award,
  Coins,
  Users,
  Camera,
  Upload,
  Crop,
  Check,
  Copy,
  Package,
  LogIn
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiService, { Purchase } from '@/services/api';
import AuthModal from '@/shared/ui/AuthModal';

interface UserProfile {
  id: string;
  telegram_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  birthdate?: string;
  gender?: string;
  age?: number;
  language_code?: string;
  is_premium?: boolean;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  consent_personal_data?: boolean;
  consent_marketing?: boolean;
  photo_url?: string;
  allows_write_to_pm?: boolean;
  bonus?: number;
  status?: string;
  total_spent?: number;
  bonus_easter_egg?: boolean;
  has_seen_tour?: boolean;
  referral_code?: string;
  referred_by?: string;
  referral_bonus_received?: boolean;
  total_referrals?: number;
  position?: string;
  // Добавляем информацию о конфигурации статуса
  status_config?: {
    bonus_percent?: number;
    discount_multiplier?: number | string; // Может приходить как строка из API
    is_discount_only?: boolean;
    display_name?: string;
    emoji?: string;
  };
}

const Profile = () => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  
  // Avatar states
  const [telegramAvatar, setTelegramAvatar] = useState<string | null>(null);
  const [loadingAvatar, setLoadingAvatar] = useState(false);

  // Avatar upload states (for future custom upload)
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animation states
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);

  // Purchase history states
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [showPurchases, setShowPurchases] = useState(true); // По умолчанию показываем
  const [showAllPurchases, setShowAllPurchases] = useState(false); // Показать все или только 3

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Modal with items of selected purchase
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Scroll to top on mount and disable browser scroll restoration
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { history } = window;
    const previousRestoration = (history as any).scrollRestoration;
    if ('scrollRestoration' in history) {
      (history as any).scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    return () => {
      if ('scrollRestoration' in history && previousRestoration) {
        (history as any).scrollRestoration = previousRestoration;
      }
    };
  }, []);

  // Lock body scroll when items modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    if (showItemsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow || '';
    }
    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, [showItemsModal]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      loadProfile();
      loadPurchaseHistory(); // Загружаем покупки сразу
      loadTelegramAvatar(); // Загружаем аватар из Telegram
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUser]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCurrentUser();
      setProfile(response);
      setFormData(response);
    } catch (error) {
      console.error('Failed to load profile:', error);
      customToast.error('Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Exclude role from form data as it's not editable by user
      const { role, ...updateData } = formData;
      await apiService.updateProfile(currentUser!.id, updateData);
      setProfile({ ...profile!, ...formData });
      setEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      customToast.error('Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setEditing(false);
  };

  // Avatar upload handlers
  const handleAvatarClick = () => {
    if (editing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setShowAvatarModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedImage) return;
    
    try {
      setUploadingAvatar(true);
      // TODO: Implement avatar upload API
      // const response = await apiService.uploadAvatar(selectedImage);
      // setProfile({ ...profile!, photo_url: response.photo_url });
      setShowAvatarModal(false);
      setSelectedImage(null);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      customToast.error('Не удалось загрузить аватар');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCopyReferral = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
    } catch (error) {
      console.error('Failed to copy referral code:', error);
      customToast.error('Не удалось скопировать реферальный код');
    }
  };

  const handleCopyReferralLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedReferralLink(true);
      setTimeout(() => setCopiedReferralLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy referral link:', error);
      customToast.error('Не удалось скопировать реферальную ссылку');
    }
  };

  const loadPurchaseHistory = async () => {
    if (loadingPurchases) return;

    try {
      setLoadingPurchases(true);
      const data = await apiService.getPurchaseHistory();
      setPurchases(data.purchases);
    } catch (error) {
      console.error('Failed to load purchase history:', error);
      customToast.error('Не удалось загрузить историю покупок');
    } finally {
      setLoadingPurchases(false);
    }
  };

  const loadTelegramAvatar = async () => {
    if (loadingAvatar) return;

    try {
      setLoadingAvatar(true);
      const data = await apiService.getUserAvatar();
      setTelegramAvatar(data.photo_url);
    } catch (error) {
      console.error('Failed to load Telegram avatar:', error);
      // Не показываем ошибку пользователю, просто используем дефолтный аватар
    } finally {
      setLoadingAvatar(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };


  const getStatusName = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'gold': return 'Золото';
      case 'silver': return 'Серебро';
      case 'bronze': return 'Бронза';
      default: return 'Бронза';
    }
  };

  const getAgeText = (age?: number) => {
    if (!age || age === 0 || isNaN(age)) return 'Не указано';
    return age.toString();
  };

  const getAgeLabel = (age?: number) => {
    if (!age || age === 0 || isNaN(age)) return 'Лет';
    const lastDigit = age % 10;
    const lastTwoDigits = age % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return 'лет';
    }

    switch (lastDigit) {
      case 1: return 'год';
      case 2:
      case 3:
      case 4: return 'года';
      default: return 'лет';
    }
  };

  // Получение отображаемого имени статуса с эмодзи
  const getStatusDisplayName = () => {
    if (profile?.status_config?.display_name && profile?.status_config?.emoji) {
      return `${profile.status_config.emoji} ${profile.status_config.display_name}`;
    }
    return getStatusName(profile?.status);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />

        <div className="w-full max-w-md mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
            >
              <LogIn className="w-8 h-8 text-gray-600 dark:text-gray-300" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-2"
            >
              Добро пожаловать
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center text-gray-600 dark:text-gray-400 mb-8"
            >
              Войдите в систему для доступа к профилю
            </motion.p>

            {/* Auth Button */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium py-3 px-6 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Войти</span>
            </button>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-6 text-center"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Безопасная авторизация
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="relative">
                {telegramAvatar ? (
                  <img
                    src={telegramAvatar}
                    alt="Profile from Telegram"
                    className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-600"
                  />
                ) : profile?.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt="Profile"
                    className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-600"
                  />
                ) : loadingAvatar ? (
                  <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </div>
                )}

                {/* Premium badge */}
                {profile?.is_premium && (
                  <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded">
                    ★
                  </div>
                )}

                {editing && (
                  <button
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 bg-gray-800 dark:bg-white text-white dark:text-gray-800 p-1.5 rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
                    title="Загрузить фото"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {profile?.first_name} {profile?.last_name}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">@{profile?.username}</p>
                <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium mt-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  <Award className="w-3 h-3 mr-1" />
                  {getStatusDisplayName()}
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Сохранить
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Отмена
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Редактировать
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main content */}
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Личная информация
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Имя
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.first_name || ''}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Введите имя"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{profile?.first_name || 'Не указано'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Фамилия
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.last_name || ''}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{profile?.last_name || 'Не указано'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Отчество
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.middle_name || ''}
                      onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{profile?.middle_name || 'Не указано'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Телефон
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="+7 (999) 999-99-99"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{profile?.phone || 'Не указано'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Дата рождения
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={formData.birthdate || ''}
                      onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{formatDate(profile?.birthdate)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Пол
                  </label>
                  {editing ? (
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Не указано</option>
                      <option value="male">Мужской</option>
                      <option value="female">Женский</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {profile?.gender === 'male' ? 'Мужской' :
                       profile?.gender === 'female' ? 'Женский' : 'Не указано'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Статистика аккаунта
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Coins className="w-6 h-6 text-gray-600 dark:text-gray-300 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {profile?.bonus || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Бонусов</div>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Users className="w-6 h-6 text-gray-600 dark:text-gray-300 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {profile?.total_referrals || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Рефералов</div>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-300 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getAgeText(profile?.age)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{getAgeLabel(profile?.age)}</div>
                </div>
              </div>
            </div>


            {/* Referral Code */}
            {profile?.referral_code && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Реферальная ссылка
                </h2>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
                  {/* Referral Code & Link in Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Реферальный код
                      </label>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 text-base lg:text-lg font-mono text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-3 py-2 rounded-md border text-center break-all">
                          {profile.referral_code}
                        </code>
                        <button
                          onClick={() => handleCopyReferral(profile.referral_code!)}
                          className="flex items-center justify-center space-x-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 whitespace-nowrap"
                        >
                          {copiedReferral ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ссылка для друзей
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-md border overflow-hidden">
                          <div className="px-3 py-2 text-xs lg:text-sm text-gray-900 dark:text-white font-mono break-all">
                            https://t.me/MedusaMDA_bot?start=ref_{profile.referral_code}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyReferralLink(`https://t.me/MedusaMDA_bot?start=ref_${profile.referral_code}`)}
                          className="flex items-center justify-center space-x-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 whitespace-nowrap"
                        >
                          <AnimatePresence mode="wait">
                            {copiedReferralLink ? (
                              <motion.div
                                key="check-link"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="flex items-center space-x-1"
                              >
                                <Check className="w-4 h-4" />
                                <span className="text-sm hidden lg:inline">Скопировано!</span>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="copy-link"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="flex items-center space-x-1"
                              >
                                <Copy className="w-4 h-4" />
                                <span className="text-sm hidden lg:inline">Скопировать</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 text-center lg:text-left">
                    Поделитесь ссылкой с друзьями и получайте бонусы за каждую регистрацию!
                  </div>
                </div>
              </div>
            )}

            {/* Purchase History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  История покупок
                  {purchases.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      ({purchases.length})
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setShowPurchases(!showPurchases)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors"
                >
                  {showPurchases ? 'Скрыть' : 'Показать'}
                </button>
              </div>

              <AnimatePresence>
                {showPurchases && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {loadingPurchases ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                        <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Загружаем...</span>
                      </div>
                    ) : purchases.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Покупки не найдены</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Wide layout for purchases on desktop */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                          {(showAllPurchases ? purchases : purchases.slice(0, 6)).map((purchase) => (
                            <button
                              key={purchase.id}
                              type="button"
                              onClick={() => { setSelectedPurchase(purchase); setShowItemsModal(true); }}
                              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {purchase.shopname || 'Неизвестный магазин'}
                                  </h3>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {formatDate(purchase.created_at)}
                                  </div>
                                  {purchase.items && purchase.items.length > 0 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Позиций: {purchase.items.length}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right ml-2 flex-shrink-0">
                                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {purchase.total_sum.toLocaleString()} ₽
                                  </div>
                                  {purchase.bonus_added > 0 && (
                                    <div className="text-sm text-green-600 dark:text-green-400 mt-0.5">
                                      +{purchase.bonus_added} бонусов
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                        
                        {/* Show more/less button */}
                        {purchases.length > 6 && (
                          <div className="flex justify-center pt-4">
                            <button
                              onClick={() => setShowAllPurchases(!showAllPurchases)}
                              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200"
                            >
                              {showAllPurchases ? 'Показать меньше' : `Показать все (${purchases.length})`}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Additional Info */}
            <div className="space-y-6">
              
              {/* Account Dates */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Важные даты
                </h3>

                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Регистрация</div>
                    <div className="text-gray-900 dark:text-white font-medium">{formatDate(profile?.created_at)}</div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Последний вход</div>
                    <div className="text-gray-900 dark:text-white font-medium">{formatDate(profile?.last_login)}</div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Обновлено</div>
                    <div className="text-gray-900 dark:text-white font-medium">{formatDate(profile?.updated_at)}</div>
                  </div>
                </div>
              </div>

              
            </div>
          </div>

          {/* Avatar Upload Modal */}
          {showAvatarModal && (
            <>
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Обновить аватар
                    </h3>
                    <button
                      onClick={() => setShowAvatarModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {selectedImage && (
                    <div className="mb-4">
                      <div className="flex justify-center mb-4">
                        <div className="relative">
                          <img
                            src={selectedImage}
                            alt="Preview"
                            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                          />
                          <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-400 flex items-center justify-center bg-blue-50 bg-opacity-50">
                            <Crop className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                        Изображение будет обрезано до квадратного формата
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowAvatarModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleAvatarUpload}
                      disabled={uploadingAvatar || !selectedImage}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {uploadingAvatar ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Загрузка...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Сохранить
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Purchase Items Modal */}
          {showItemsModal && selectedPurchase && (
            <>
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedPurchase.shopname || 'Покупка'}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(selectedPurchase.created_at)}
                      </div>
                    </div>
                    <button
                      onClick={() => { setShowItemsModal(false); setSelectedPurchase(null); }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label="Закрыть"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="text-gray-900 dark:text-white text-base font-semibold">
                      Сумма: {selectedPurchase.total_sum.toLocaleString()} ₽
                    </div>
                    {selectedPurchase.bonus_added > 0 && (
                      <div className="text-green-700 dark:text-green-400 text-sm font-medium">
                        +{selectedPurchase.bonus_added} бонусов
                      </div>
                    )}
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto space-y-2">
                    {selectedPurchase.items && selectedPurchase.items.length > 0 ? (
                      selectedPurchase.items.map((item, index) => (
                        <div
                          key={item.id || index}
                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
                        >
                          <div className="min-w-0 mr-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {item.name}
                            </div>
                            {item.category && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {item.category}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {item.quantity !== 1 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">× {item.quantity}</div>
                            )}
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {item.price.toLocaleString()} ₽
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-400">Товары отсутствуют</div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => { setShowItemsModal(false); setSelectedPurchase(null); }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
    </div>
  );
};

export default Profile;
