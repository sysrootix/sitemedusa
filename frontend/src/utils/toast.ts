import toast from 'react-hot-toast';

/**
 * Утилита для показа уведомлений с автоматическим удалением предыдущих
 * Гарантирует, что одновременно показывается только 1 уведомление
 */

class ToastManager {
  private currentToastId: string | null = null;

  /**
   * Показать success уведомление
   */
  success(message: string, options?: any) {
    this.dismissCurrent();
    this.currentToastId = toast.success(message, {
      ...options,
      id: `success-${Date.now()}`,
    });
    return this.currentToastId;
  }

  /**
   * Показать error уведомление
   */
  error(message: string, options?: any) {
    this.dismissCurrent();
    this.currentToastId = toast.error(message, {
      ...options,
      id: `error-${Date.now()}`,
    });
    return this.currentToastId;
  }

  /**
   * Показать loading уведомление
   */
  loading(message: string, options?: any) {
    this.dismissCurrent();
    this.currentToastId = toast.loading(message, {
      ...options,
      id: `loading-${Date.now()}`,
    });
    return this.currentToastId;
  }

  /**
   * Показать обычное уведомление
   */
  show(message: string, options?: any) {
    this.dismissCurrent();
    this.currentToastId = toast(message, {
      ...options,
      id: `toast-${Date.now()}`,
    });
    return this.currentToastId;
  }

  /**
   * Показать кастомное уведомление
   */
  custom(jsx: React.ReactElement, options?: any) {
    this.dismissCurrent();
    this.currentToastId = toast.custom(jsx, {
      ...options,
      id: `custom-${Date.now()}`,
    });
    return this.currentToastId;
  }

  /**
   * Закрыть текущее уведомление
   */
  dismissCurrent() {
    if (this.currentToastId) {
      toast.dismiss(this.currentToastId);
      this.currentToastId = null;
    }
  }

  /**
   * Закрыть все уведомления
   */
  dismissAll() {
    toast.dismiss();
    this.currentToastId = null;
  }

  /**
   * Promise-based уведомление
   */
  async promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    },
    options?: any
  ): Promise<T> {
    this.dismissCurrent();
    
    return toast.promise(
      promise,
      messages,
      {
        ...options,
        id: `promise-${Date.now()}`,
      }
    );
  }

  // ============================================
  // 🎨 Специальные уведомления с эмодзи
  // ============================================

  /**
   * Уведомление о добавлении в корзину
   */
  addedToCart(productName: string) {
    return this.success(`Товар добавлен в корзину`, {
      icon: '🛒',
      duration: 3000,
    });
  }

  /**
   * Уведомление об удалении из корзины
   */
  removedFromCart() {
    return this.show(`Товар удален из корзины`, {
      icon: '🗑️',
      duration: 2500,
    });
  }

  /**
   * Уведомление о добавлении в избранное
   */
  addedToFavorites(productName?: string) {
    const message = productName 
      ? `"${productName}" добавлен в избранное`
      : 'Добавлено в избранное';
    return this.success(message, {
      icon: '❤️',
      duration: 2500,
    });
  }

  /**
   * Уведомление об удалении из избранного
   */
  removedFromFavorites() {
    return this.show(`Удалено из избранного`, {
      icon: '💔',
      duration: 2500,
    });
  }

  /**
   * Уведомление о необходимости авторизации
   */
  needAuth(action: string = 'использовать корзину') {
    return this.error(`Войдите в аккаунт, чтобы ${action}`, {
      icon: '🔐',
      duration: 4000,
    });
  }

  /**
   * Уведомление об успешном заказе
   */
  orderSuccess() {
    return this.success(`Заказ успешно оформлен!`, {
      icon: '🎉',
      duration: 4000,
    });
  }

  /**
   * Уведомление о копировании
   */
  copied(text?: string) {
    const message = text ? `Скопировано: ${text}` : 'Скопировано в буфер обмена';
    return this.success(message, {
      icon: '📋',
      duration: 2000,
    });
  }

  /**
   * Уведомление о сохранении
   */
  saved() {
    return this.success(`Сохранено!`, {
      icon: '💾',
      duration: 2000,
    });
  }

  /**
   * Уведомление о сетевой ошибке
   */
  networkError() {
    return this.error(`Проблемы с подключением к интернету`, {
      icon: '🌐',
      duration: 4000,
    });
  }

  /**
   * Уведомление о загрузке
   */
  uploading() {
    return this.loading(`Загрузка...`, {
      icon: '⬆️',
    });
  }

  /**
   * Уведомление об обновлении
   */
  updated() {
    return this.success(`Обновлено!`, {
      icon: '✅',
      duration: 2000,
    });
  }

  /**
   * Уведомление о скидке/промокоде
   */
  promoApplied(discount: string) {
    return this.success(`Промокод применен! Скидка ${discount}`, {
      icon: '🎁',
      duration: 3500,
    });
  }

  /**
   * Уведомление о недоступности товара
   */
  outOfStock() {
    return this.error(`Товара нет в наличии`, {
      icon: '📦',
      duration: 3000,
    });
  }
}

// Экспортируем singleton instance
export const customToast = new ToastManager();

// Также экспортируем оригинальный toast для особых случаев
export { toast as originalToast };

