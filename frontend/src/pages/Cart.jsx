import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiShoppingCart, FiArrowRight, FiArrowLeft, FiCheckCircle, FiShield, FiTruck } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../utils/formatters';
import api from '../services/api';
import Button from '../components/common/Button';

// کامپوننت صفحه سبد خرید و فرایند ثبت سفارش
const Cart = () => {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart, fetchCart } = useCart();
  const { user } = useAuth();
  const { language, t, isRtl } = useLanguage();
  const navigate = useNavigate();

  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'shipping', 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

  // مشخصات فرم ارسال
  const [shippingData, setShippingData] = useState({
    shipping_name: user?.name || '',
    shipping_email: user?.email || '',
    shipping_phone: '09123456789',
    shipping_address: 'خیابان آزادی، کوچه پنجم، پلاک ۱۲',
    city: 'تهران',
    postal_code: '1234567890',
    notes: ''
  });

  const taxAmount = Math.round(cartTotal * 0.08);
  const grandTotal = cartTotal + taxAmount;

  const handleInputChange = (e) => {
    setShippingData({ ...shippingData, [e.target.name]: e.target.value });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/orders/checkout', {
        ...shippingData,
        payment_method: language === 'fa' ? 'ثبت مستقیم سفارش (در انتظار تایید ادمین)' : 'Direct Order (Awaiting Admin Confirmation)'
      });

      if (res.success) {
        setCompletedOrder(res.data);
        await clearCart();
        setCheckoutStep('success');
      } else {
        setError(res.message || t('common.error', 'خطا در ثبت سفارش'));
      }
    } catch (err) {
      setError(err.message || t('common.error', 'ثبت سفارش با مشکل مواجه شد. لطفاً دوباره تلاش کنید.'));
    } finally {
      setLoading(false);
    }
  };

  const ArrowForward = isRtl ? FiArrowLeft : FiArrowRight;

  // ۱. صفحه موفقیت ثبت سفارش
  if (checkoutStep === 'success' && completedOrder) {
    return (
      <div className="max-w-3xl mx-auto my-12 px-4 text-center">
        <div className="card p-8 sm:p-12 shadow-xl border-green-500/30">
          <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            {t('cart.successTitle', 'سفارش شما با موفقیت ثبت شد!')}
          </h1>
          <p className="text-base font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 py-2 px-4 rounded-xl inline-block mb-4 border border-amber-200 dark:border-amber-800">
            {t('cart.pendingAdminNotice', 'سفارش شما با موفقیت ثبت شد و منتظر تاییدیه ادمین است.')}
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('cart.trackingNumber', 'شماره پیگیری سفارش شما:')}{' '}
            <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{completedOrder.order_number}</span>
          </p>

          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl text-start mb-8 space-y-3">
            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-gray-500 dark:text-gray-400">{t('cart.receiver', 'تحویل گیرنده:')}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{completedOrder.order?.shipping_name || shippingData.shipping_name}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-gray-500 dark:text-gray-400">{t('cart.deliveryAddress', 'آدرس تحویل:')}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{completedOrder.order?.shipping_address || shippingData.shipping_address}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-gray-500 dark:text-gray-400 font-bold">{t('cart.finalTotal', 'مبلغ کل سفارش:')}</span>
              <span className="text-xl font-extrabold text-primary-600 dark:text-primary-400">
                {formatPrice(completedOrder.total_amount || grandTotal, language)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/products">
              <Button variant="primary" className="px-8 py-3">{t('cart.continueShopping', 'ادامه خرید')}</Button>
            </Link>
            {user && (
              <Link to="/profile">
                <Button variant="secondary" className="px-8 py-3">{t('cart.viewOrderHistory', 'مشاهده تاریخچه سفارش‌ها')}</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ۲. وضعیت سبد خالی
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto my-16 px-4 text-center">
        <div className="card p-12 shadow-sm">
          <FiShoppingCart className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('cart.emptyTitle', 'سبد خرید شما خالی است')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {t('cart.emptyDesc', 'شما هنوز هیچ محصولی را به سبد خرید خود اضافه نکرده‌اید.')}
          </p>
          <Link to="/products">
            <Button variant="primary" size="lg" className="inline-flex items-center space-x-2 rtl:space-x-reverse">
              <span>{t('cart.browseProducts', 'مشاهده فروشگاه و خرید کالا')}</span>
              <ArrowForward className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ۳. نمایش سبد خرید و فرم ارسال
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          {checkoutStep === 'cart' ? t('cart.title', 'سبد خرید شما') : t('cart.shippingInfoTitle', 'اطلاعات ارسال و تایید سفارش')}
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-700 flex items-center space-x-1 rtl:space-x-reverse"
        >
          <FiTrash2 className="w-4 h-4" />
          <span>{t('cart.clearCart', 'خالی کردن سبد')}</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ستون اصلی: لیست کالاها یا فرم اطلاعات ارسال */}
        <div className="lg:col-span-8 space-y-4">
          {checkoutStep === 'cart' ? (
            cartItems.map((item) => (
              <div
                key={item.id || item.product_id}
                className="card p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:shadow-md"
              >
                <div className="flex items-center space-x-4 rtl:space-x-reverse w-full sm:w-auto">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'}
                    alt={item.name}
                    className="w-20 h-20 object-contain rounded-lg bg-gray-100 dark:bg-gray-800 p-2 flex-shrink-0"
                  />
                  <div>
                    <Link
                      to={`/products/${item.slug || ''}`}
                      className="font-bold text-gray-900 dark:text-white hover:text-primary-600 transition-colors line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('cart.unitPrice', 'قیمت واحد:')} {formatPrice(item.price, language)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-6 rtl:space-x-reverse">
                  {/* شمارنده تعداد */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item.id || item.product_id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-600 rounded"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id || item.product_id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-600 rounded"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-end font-bold text-primary-600 dark:text-primary-400 text-base sm:text-lg min-w-[140px]">
                    {formatPrice(item.price * item.quantity, language)}
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id || item.product_id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title={t('common.delete', 'حذف')}
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            /* فرم ارسال مشخصات */
            <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="card p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('cart.receiverInfoTitle', 'مشخصات تحویل‌گیرنده')}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('cart.fullName', 'نام و نام خانوادگی')}</label>
                  <input
                    type="text"
                    name="shipping_name"
                    required
                    value={shippingData.shipping_name}
                    onChange={handleInputChange}
                    className="input"
                    placeholder={t('cart.fullNamePlaceholder', 'علی محمدی')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('cart.email', 'ایمیل')}</label>
                  <input
                    type="email"
                    name="shipping_email"
                    required
                    value={shippingData.shipping_email}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('cart.phone', 'شماره تماس')}</label>
                  <input
                    type="tel"
                    name="shipping_phone"
                    required
                    value={shippingData.shipping_phone}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="09123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('cart.city', 'شهر')}</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={shippingData.city}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="تهران"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('cart.address', 'آدرس کامل پستی')}</label>
                <textarea
                  name="shipping_address"
                  required
                  rows="3"
                  value={shippingData.shipping_address}
                  onChange={handleInputChange}
                  className="input"
                  placeholder={t('cart.addressPlaceholder', 'خیابان، کوچه، پلاک، واحد')}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('cart.postalCode', 'کد پستی')}</label>
                  <input
                    type="text"
                    name="postal_code"
                    required
                    value={shippingData.postal_code}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('cart.notes', 'یادداشت سفارش (اختیاری)')}</label>
                  <input
                    type="text"
                    name="notes"
                    value={shippingData.notes}
                    onChange={handleInputChange}
                    className="input"
                    placeholder={t('cart.notesPlaceholder', 'توضیحات اضافی')}
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* ستون کناری: خلاصه هزینه و دکمه پرداخت */}
        <div className="lg:col-span-4">
          <div className="card p-6 sticky top-24 space-y-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-3">
              {t('cart.summaryTitle', 'خلاصه صورت‌حساب')}
            </h2>

            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex justify-between">
                <span>{t('cart.itemsSubtotal', 'مجموع اقلام:')}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(cartTotal, language)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('cart.tax', 'مالیات و عوارض (۸٪):')}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(taxAmount, language)}</span>
              </div>
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>{t('cart.shippingCost', 'هزینه ارسال:')}</span>
                <span className="font-semibold">{t('cart.freeExpressShipping', 'رایگان (تحویل اکسپرس)')}</span>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center text-base">
                <span className="font-bold text-gray-900 dark:text-white">{t('cart.totalPayable', 'مبلغ کل قابل پرداخت:')}</span>
                <span className="text-xl font-extrabold text-primary-600 dark:text-primary-400">{formatPrice(grandTotal, language)}</span>
              </div>
            </div>

            {checkoutStep === 'cart' ? (
              user ? (
                <Button
                  onClick={() => setCheckoutStep('shipping')}
                  variant="primary"
                  size="lg"
                  className="w-full py-3 flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  <span>{t('cart.continueToShipping', 'ادامه ثبت سفارش')}</span>
                  <ArrowForward className="w-5 h-5" />
                </Button>
              ) : (
                <div className="space-y-3">
                  <Link to="/login" className="block">
                    <Button variant="primary" size="lg" className="w-full py-3">
                      {t('cart.loginToCheckout', 'ورود به حساب جهت ثبت سفارش')}
                    </Button>
                  </Link>
                  <p className="text-xs text-center text-gray-500">
                    {t('cart.loginToCheckoutDesc', 'برای تسویه‌حساب ابتدا باید وارد حساب کاربری خود شوید.')}
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <Button
                  form="checkout-form"
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="w-full py-3 flex items-center justify-center space-x-2 rtl:space-x-reverse"
                >
                  <FiCheckCircle className="w-5 h-5" />
                  <span>{loading ? t('cart.placingOrder', 'در حال ثبت سفارش...') : t('cart.confirmAndPlaceOrder', 'تایید و نهایی‌سازی سفارش')}</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-1"
                >
                  {t('cart.backToCart', 'بازگشت به سبد خرید')}
                </button>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <FiShield className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{t('cart.authenticityGuarantee', 'ضمانت اصالت و سلامت تمامی قطعات')}</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <FiTruck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>{t('cart.safeDeliveryGuarantee', 'ارسال سریع با بسته‌بندی ایمن')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
