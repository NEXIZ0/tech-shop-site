import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

// فوتر سایت با پشتیبانی کامل از دو زبان
const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* ستون برند */}
          <div className="space-y-4">
            <span className="text-2xl font-extrabold bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
              {t('common.appName', 'TechStore')}
            </span>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t('footer.brandDesc', 'مرجع تخصصی خرید برترین قطعات سخت‌افزاری، لپ‌تاپ، تجهیزات گیمینگ و لوازم جانبی دیجیتال با اصالت و گارانتی معتبر.')}
            </p>
          </div>

          {/* لینک‌های سریع */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.quickLinks', 'دسترسی سریع')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/products" className="hover:text-primary-400 transition-colors">
                  {t('footer.allProducts', 'کاتالوگ محصولات')}
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-primary-400 transition-colors">
                  {t('footer.categories', 'دسته‌بندی‌ها')}
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-primary-400 transition-colors">
                  {t('footer.viewCart', 'مشاهده سبد خرید')}
                </Link>
              </li>
            </ul>
          </div>

          {/* دسته‌های محبوب */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.topCategories', 'دسته‌های محبوب')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/products?category=1" className="hover:text-primary-400 transition-colors">Laptops & Computers</Link></li>
              <li><Link to="/products?category=2" className="hover:text-primary-400 transition-colors">Smartphones & Tablets</Link></li>
              <li><Link to="/products?category=3" className="hover:text-primary-400 transition-colors">Audio & Headphones</Link></li>
              <li><Link to="/products?category=4" className="hover:text-primary-400 transition-colors">Monitors & Displays</Link></li>
            </ul>
          </div>

          {/* پشتیبانی مشتریان */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.customerSupport', 'پشتیبانی مشتریان')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>{t('footer.email', 'ایمیل: support@techstore.com')}</li>
              <li>{t('footer.phone', 'تلفن: ۰۲۱-۱۲۳۴۵۶۷۸')}</li>
              <li>{t('footer.hours', 'ساعات کاری: شنبه تا چهارشنبه ۹ تا ۱۸')}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} {t('footer.copyright', 'تمامی حقوق محفوظ است. پیاده‌سازی شده با React + PHP REST API MVC.')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;