import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../utils/formatters';
import api from '../services/api';
import { FiUser, FiPackage, FiKey, FiInfo, FiCheckCircle } from 'react-icons/fi';
import Button from '../components/common/Button';

// صفحه حساب کاربری و سوابق سفارشات
const Profile = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'profile', 'password'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // فرم ویرایش مشخصات
  const [name, setName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState('');

  // فرم تغییر رمز عبور
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');

  useEffect(() => {
    if (user?.name) setName(user.name);

    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await api.get('/user/orders');
        if (res.success) {
          setOrders(res.data.orders || []);
        }
      } catch (err) {
        console.error('خطا در بارگذاری سفارشات:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      const res = await api.put('/user/profile', { name });
      if (res.success) {
        setProfileMsg(t('profile.updateSuccess', 'اطلاعات با موفقیت به‌روزرسانی شد'));
      }
    } catch (err) {
      setProfileMsg(err.message || t('common.error', 'خطا در به‌روزرسانی مشخصات'));
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassError('');

    if (newPassword !== confirmPassword) {
      setPassError(t('profile.passMismatch', 'تکرار رمز عبور جدید مطابقت ندارد'));
      return;
    }

    if (newPassword.length < 6) {
      setPassError(t('profile.passMinChars', 'حداقل ۶ کاراکتر'));
      return;
    }

    try {
      const res = await api.put('/user/password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      if (res.success) {
        setPassMsg(t('profile.passSuccess', 'رمز عبور با موفقیت تغییر یافت'));
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPassError(err.message || t('common.error', 'خطا در تغییر رمز عبور'));
    }
  };

  /**
   * تابع دریافت اطلاعات و برچسب وضعیت سفارش
   */
  const getOrderStatusInfo = (status) => {
    const s = String(status || 'Pending').toLowerCase();
    switch (s) {
      case 'pending':
        return {
          badge: t('orderStatus.pending.badge', 'منتظر تاییدیه ادمین'),
          message: t('orderStatus.pending.message', 'سفارش شما با موفقیت ثبت شد و منتظر تاییدیه ادمین است.'),
          badgeClass: 'badge-warning',
          boxClass: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
        };
      case 'approved':
        return {
          badge: t('orderStatus.approved.badge', 'تایید شده'),
          message: t('orderStatus.approved.message', 'سفارش شما تایید شده است و تا چند روز آینده به دست شما میرسد.'),
          badgeClass: 'badge-success',
          boxClass: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
        };
      case 'processing':
        return {
          badge: t('orderStatus.processing.badge', 'در حال پردازش'),
          message: t('orderStatus.processing.message', 'سفارش شما در حال آماده‌سازی در انبار جهت ارسال است.'),
          badgeClass: 'badge-info',
          boxClass: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
        };
      case 'shipped':
        return {
          badge: t('orderStatus.shipped.badge', 'ارسال شده'),
          message: t('orderStatus.shipped.message', 'سفارش شما به شرکت پست تحویل داده شده و در مسیر ارسال است.'),
          badgeClass: 'badge-info',
          boxClass: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300'
        };
      case 'delivered':
        return {
          badge: t('orderStatus.delivered.badge', 'تحویل داده شده'),
          message: t('orderStatus.delivered.message', 'سفارش با موفقیت تحویل شما گردید.'),
          badgeClass: 'badge-success',
          boxClass: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
        };
      case 'cancelled':
        return {
          badge: t('orderStatus.cancelled.badge', 'لغو شده'),
          message: t('orderStatus.cancelled.message', 'این سفارش لغو گردیده است.'),
          badgeClass: 'badge-danger',
          boxClass: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        };
      default:
        return {
          badge: status,
          message: '',
          badgeClass: 'badge-info',
          boxClass: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* کارت بالای صفحه مشخصات کلی */}
      <div className="card p-6 flex items-center space-x-4 rtl:space-x-reverse bg-gradient-to-r from-primary-600 to-indigo-700 text-white border-0 shadow-lg">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center font-bold text-2xl flex-shrink-0">
          {(user?.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user?.name}</h1>
          <p className="text-primary-100 text-sm mt-1">{user?.email}</p>
          <span className="inline-block mt-2 px-3 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
            {t('profile.rolePrefix', 'نقش کاربری:')} {user?.role === 'Admin' ? t('profile.userRoleAdmin', 'مدیر سیستم (Admin)') : t('profile.userRoleUser', 'کاربر عادی')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* سایدبار تب‌ها */}
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-start px-4 py-3 rounded-xl font-medium flex items-center space-x-3 rtl:space-x-reverse transition-colors ${
              activeTab === 'orders'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FiPackage className="w-5 h-5" />
            <span>{t('profile.tabOrders', 'سفارش‌های من')} ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-start px-4 py-3 rounded-xl font-medium flex items-center space-x-3 rtl:space-x-reverse transition-colors ${
              activeTab === 'profile'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FiUser className="w-5 h-5" />
            <span>{t('profile.tabProfile', 'مشخصات فردی')}</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`w-full text-start px-4 py-3 rounded-xl font-medium flex items-center space-x-3 rtl:space-x-reverse transition-colors ${
              activeTab === 'password'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FiKey className="w-5 h-5" />
            <span>{t('profile.tabPassword', 'تغییر رمز عبور')}</span>
          </button>
        </div>

        {/* محتوای تب فعال */}
        <div className="md:col-span-3">
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('profile.ordersTitle', 'سوابق سفارش‌ها')}</h2>
              {loadingOrders ? (
                <div className="card p-8 text-center text-gray-500">{t('profile.loadingOrders', 'در حال بارگذاری سفارشات...')}</div>
              ) : orders.length === 0 ? (
                <div className="card p-12 text-center text-gray-500 dark:text-gray-400">
                  <FiPackage className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>{t('profile.emptyOrders', 'تاکنون هیچ سفارشی ثبت نکرده‌اید.')}</p>
                </div>
              ) : (
                orders.map((ord) => {
                  const statusInfo = getOrderStatusInfo(ord.status);
                  return (
                    <div key={ord.id} className="card p-6 space-y-4 shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex flex-wrap items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3 gap-2">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">{t('profile.orderNumber', 'شماره سفارش')}</span>
                          <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{ord.order_number}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">{t('profile.orderDate', 'تاریخ ثبت')}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{ord.created_at}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">{t('profile.totalAmount', 'مبلغ کل')}</span>
                          <span className="text-base font-extrabold text-gray-900 dark:text-white">
                            {formatPrice(ord.total_amount, language)}
                          </span>
                        </div>
                        <div>
                          <span className={`badge ${statusInfo.badgeClass}`}>
                            {statusInfo.badge}
                          </span>
                        </div>
                      </div>

                      {/* پیام وضعیت سفارش */}
                      {statusInfo.message && (
                        <div className={`p-3 rounded-xl border text-sm flex items-center space-x-2 rtl:space-x-reverse ${statusInfo.boxClass}`}>
                          <FiInfo className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">{statusInfo.message}</span>
                        </div>
                      )}

                      {/* اقلام سفارش */}
                      {ord.items && ord.items.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {ord.items.map((it) => (
                            <div key={it.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                              <span className="text-gray-800 dark:text-gray-200 font-medium">
                                {it.quantity} × {it.product_name}
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {formatPrice(it.price * it.quantity, language)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="card p-6 max-w-md shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('profile.editProfileTitle', 'ویرایش مشخصات فردی')}</h2>
              {profileMsg && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">{profileMsg}</div>}
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.fullName', 'نام کامل')}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.emailNotEditable', 'ایمیل (غیرقابل تغییر)')}</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="input opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                  />
                </div>
                <Button type="submit" variant="primary" className="w-full">{t('profile.saveChanges', 'ذخیره تغییرات')}</Button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="card p-6 max-w-md shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('profile.changePassTitle', 'تغییر رمز عبور')}</h2>
              {passMsg && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{passMsg}</div>}
              {passError && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{passError}</div>}
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.oldPassword', 'رمز عبور فعلی')}</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.newPassword', 'رمز عبور جدید')}</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                    placeholder={t('profile.passMinChars', 'حداقل ۶ کاراکتر')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.confirmNewPassword', 'تکرار رمز عبور جدید')}</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                  />
                </div>
                <Button type="submit" variant="primary" className="w-full">{t('profile.updatePassBtn', 'به‌روزرسانی رمز عبور')}</Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
