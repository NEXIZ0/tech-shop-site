import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiArrowLeft, FiCpu, FiHardDrive, FiZap } from 'react-icons/fi';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';

// صفحه اصلی فروشگاه آنلاین TechStore
const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, isRtl } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products/featured').catch(() => ({ data: { products: [] } })),
          api.get('/categories/featured').catch(() => ({ data: { categories: [] } }))
        ]);

        if (productsRes.success) {
          const prods = productsRes.data?.products || (Array.isArray(productsRes.data) ? productsRes.data : []);
          setFeaturedProducts(prods);
        }

        if (categoriesRes.success) {
          const cats = categoriesRes.data?.categories || (Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
          setCategories(cats);
        }
      } catch (err) {
        console.error('خطا در بارگذاری داده‌های صفحه اصلی:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const ArrowIcon = isRtl ? FiArrowLeft : FiArrowRight;

  return (
    <div className="space-y-16">
      {/* بنر هیرو اصلی */}
      <section className="relative bg-gradient-to-r from-gray-950 via-indigo-950 to-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl my-4 border border-indigo-500/20">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20 lg:py-24 flex flex-col md:flex-row items-center justify-between relative z-10 gap-8">
          <div className="md:w-1/2 space-y-6 text-center md:text-start">
            <span className="inline-block px-4 py-1.5 bg-primary-500/20 text-primary-400 rounded-full text-xs font-bold uppercase tracking-wider border border-primary-500/30 shadow-sm">
              {t('hero.badge', 'نسل جدید سخت‌افزارهای گیمینگ و مهندسی')}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {t('hero.title1', 'قدرت بی‌پایان با')}{' '}
              <span className="bg-gradient-to-r from-primary-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                {t('hero.title2', 'TechStore')}
              </span>
            </h1>
            <p className="text-gray-300 text-base sm:text-lg max-w-xl leading-relaxed">
              {t('hero.subtitle', 'مرجع تخصصی خرید برترین لپ‌تاپ‌ها، پردازنده‌ها، کارت‌های گرافیک و لوازم جانبی با ضمانت اصالت کالا و ارسال سریع به سراسر کشور.')}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <Link to="/products" className="btn btn-primary text-base px-8 py-3.5 flex items-center space-x-2 rtl:space-x-reverse shadow-lg shadow-primary-600/30 hover:scale-105 transition-transform">
                <span>{t('hero.cta', 'مشاهده کاتالوگ محصولات')}</span>
                <ArrowIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="md:w-1/2 flex justify-center relative">
            <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-primary-600/30 blur-3xl absolute -z-10 animate-pulse"></div>
            <img
              src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80"
              alt="High Performance PC"
              className="rounded-2xl shadow-2xl object-cover max-h-80 w-auto border border-white/10 transform hover:scale-102 transition-transform"
            />
          </div>
        </div>
      </section>

      {/* ویژگی‌های برتر فروشگاه */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
        <div className="card p-6 flex items-center space-x-4 rtl:space-x-reverse border-s-4 border-s-primary-500 shadow-sm">
          <FiZap className="w-9 h-9 text-primary-500 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{t('features.fastShipping', 'ارسال فوق‌سریع')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('features.fastShippingDesc', 'تحویل اکسپرس و بسته‌بندی ایمن کالا')}</p>
          </div>
        </div>
        <div className="card p-6 flex items-center space-x-4 rtl:space-x-reverse border-s-4 border-s-green-500 shadow-sm">
          <FiCpu className="w-9 h-9 text-green-500 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{t('features.authenticity', 'ضمانت ۱۰۰٪ اصالت')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('features.authenticityDesc', 'تضمین کالای اورجینال مستقیم از تولیدکننده')}</p>
          </div>
        </div>
        <div className="card p-6 flex items-center space-x-4 rtl:space-x-reverse border-s-4 border-s-purple-500 shadow-sm">
          <FiHardDrive className="w-9 h-9 text-purple-500 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{t('features.warranty', 'گارانتی معتبر شرکتی')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('features.warrantyDesc', 'پشتیبانی و خدمات پس از فروش رسمی')}</p>
          </div>
        </div>
      </section>

      {/* محصولات برگزیده و ویژه */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{t('home.featuredTitle', 'محصولات برگزیده')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('home.featuredSubtitle', 'منتخب بهترین و پرفروش‌ترین قطعات سخت‌افزاری')}</p>
          </div>
          <Link to="/products" className="text-primary-600 dark:text-primary-400 font-bold text-sm hover:underline flex items-center space-x-1 rtl:space-x-reverse">
            <span>{t('home.viewAll', 'مشاهده همه')}</span>
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="card h-80 animate-pulse bg-gray-200 dark:bg-gray-800"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id || product.slug} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;