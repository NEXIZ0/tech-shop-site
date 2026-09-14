import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiSun, FiMoon, FiMenu, FiX, FiSearch, FiLogOut, FiUser, FiSliders, FiGlobe } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';

// نوبار و منوی ناوبری اصلی سایت با پشتیبانی کامل از زبان‌های فارسی و انگلیسی
const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { itemCount } = useCart();
  const { language, toggleLanguage, t, isRtl } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* لوگو و لینک‌های اصلی */}
          <div className="flex items-center space-x-8 rtl:space-x-reverse">
            <Link to="/" className="text-2xl font-black bg-gradient-to-r from-primary-600 to-indigo-500 bg-clip-text text-transparent">
              {t('nav.brand', 'TechStore')}
            </Link>

            <div className="hidden md:flex items-center space-x-6 rtl:space-x-reverse font-semibold text-sm text-gray-700 dark:text-gray-200">
              <Link to="/" className="hover:text-primary-600 transition-colors">
                {t('nav.home', 'صفحه اصلی')}
              </Link>
              <Link to="/products" className="hover:text-primary-600 transition-colors">
                {t('nav.products', 'کاتالوگ محصولات')}
              </Link>
            </div>
          </div>

          {/* باکس جستجو */}
          <div className="hidden sm:flex flex-1 max-w-md mx-6">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                placeholder={t('nav.searchPlaceholder', 'جستجوی لپ‌تاپ، مانیتور، قطعات...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none ltr:pr-10 rtl:pl-10"
              />
              <button
                type="submit"
                className={`absolute top-2.5 text-gray-400 hover:text-primary-600 ${isRtl ? 'left-3' : 'right-3'}`}
                title={t('common.search', 'جستجو')}
              >
                <FiSearch className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* ابزارها: تغییر زبان، دارک مود، سبد خرید، وضعیت کاربر */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {/* دکمه تغییر زبان */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-xs font-bold shadow-sm"
              title={language === 'fa' ? 'Switch to English' : 'تغییر به زبان فارسی'}
            >
              <FiGlobe className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="uppercase">{language === 'fa' ? 'EN' : 'FA'}</span>
            </button>

            {/* دکمه تغییر تم */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t('nav.toggleTheme', 'تغییر تم')}
            >
              {darkMode ? <FiSun className="w-5 h-5 text-yellow-400" /> : <FiMoon className="w-5 h-5" />}
            </button>

            {/* دکمه سبد خرید */}
            <Link
              to="/cart"
              className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t('nav.cart', 'سبد خرید')}
            >
              <FiShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-pulse">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* اطلاعات کاربر */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center space-x-2 rtl:space-x-reverse p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden md:inline-block text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {user.name}
                  </span>
                </button>

                {userDropdown && (
                  <div className={`absolute mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl py-2 border border-gray-200 dark:border-gray-700 z-50 animate-fade-in ${isRtl ? 'left-0' : 'right-0'}`}>
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500">{t('nav.userAccount', 'حساب کاربری')}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <FiUser className="w-4 h-4" />
                      <span>{t('nav.profile', 'پروفایل و سفارشات')}</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 text-sm text-primary-600 dark:text-primary-400 font-bold hover:bg-primary-50 dark:hover:bg-gray-700"
                      >
                        <FiSliders className="w-4 h-4" />
                        <span>{t('nav.admin', 'پنل مدیریت (Admin)')}</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdown(false);
                      }}
                      className="w-full text-start px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 flex items-center space-x-2 rtl:space-x-reverse border-t border-gray-100 dark:border-gray-700 mt-1"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>{t('nav.logout', 'خروج از حساب')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Link to="/login" className="btn btn-secondary text-sm">
                  {t('nav.login', 'ورود')}
                </Link>
                <Link to="/register" className="btn btn-primary text-sm hidden sm:inline-block">
                  {t('nav.register', 'ثبت‌نام')}
                </Link>
              </div>
            )}

            {/* دکمه منو موبایل */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300"
            >
              {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* منوی ریسپانسیو موبایل */}
      {menuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 space-y-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {t('nav.home', 'صفحه اصلی')}
          </Link>
          <Link
            to="/products"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {t('nav.products', 'کاتالوگ محصولات')}
          </Link>
          <Link
            to="/cart"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {t('nav.cart', 'سبد خرید')} ({itemCount})
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-bold text-primary-600"
            >
              {t('nav.admin', 'پنل مدیریت')}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;