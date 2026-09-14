import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiSearch, FiLayers } from 'react-icons/fi';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';

// صفحه کاتالوگ و لیست محصولات با فیلتر دسته‌بندی و جستجو
export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, isRtl } = useLanguage();

  const selectedCategory = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort') || 'id';

  const [inputSearch, setInputSearch] = useState(searchQuery);

  useEffect(() => {
    setInputSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append('category', selectedCategory);
        if (searchQuery) params.append('search', searchQuery);
        if (sortBy) params.append('sort', sortBy);

        const [prodRes, catRes] = await Promise.all([
          api.get(`/products?${params.toString()}`).catch(() => ({ data: { products: [] } })),
          api.get('/categories').catch(() => ({ data: { categories: [] } }))
        ]);

        if (prodRes.success) {
          const prodsList = prodRes.data?.products || (Array.isArray(prodRes.data) ? prodRes.data : []);
          setProducts(prodsList);
        }

        if (catRes.success) {
          const catsList = catRes.data?.categories || (Array.isArray(catRes.data) ? catRes.data : []);
          setCategories(catsList);
        }
      } catch (err) {
        setError(t('common.error', 'خطا در بارگذاری لیست محصولات'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, searchQuery, sortBy, t]);

  const handleCategorySelect = (catId) => {
    const newParams = new URLSearchParams(searchParams);
    if (catId) {
      newParams.set('category', catId);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (inputSearch.trim()) {
      newParams.set('search', inputSearch.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', e.target.value);
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* هدر صفحه و فیلترها */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('products.title', 'کاتالوگ محصولات')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('products.subtitle', 'مشاهده، مقایسه و خرید انواع سخت‌افزار')} ({products.length} {t('products.productsCount', 'محصول')})
          </p>
        </div>

        {/* فیلتر سرچ و سورت */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={t('products.searchPlaceholder', 'جستجو در محصولات...')}
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              className="input py-2 text-sm ltr:pr-10 rtl:pl-10"
            />
            <button
              type="submit"
              className={`absolute top-2.5 text-gray-400 hover:text-primary-600 ${isRtl ? 'left-3' : 'right-3'}`}
              title={t('common.search', 'جستجو')}
            >
              <FiSearch className="w-4 h-4" />
            </button>
          </form>

          <select
            value={sortBy}
            onChange={handleSortChange}
            className="input py-2 text-sm w-auto min-w-[150px]"
          >
            <option value="id">{t('products.sortNewest', 'جدیدترین‌ها')}</option>
            <option value="price">{t('products.sortPriceAsc', 'ارزان‌ترین به گران‌ترین')}</option>
            <option value="rating">{t('products.sortRating', 'محبوب‌ترین (امتیاز)')}</option>
          </select>
        </div>
      </div>

      {/* فیلتر دسته‌بندی‌ها به صورت تب و برچسب */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => handleCategorySelect('')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors flex items-center space-x-2 rtl:space-x-reverse ${
            !selectedCategory
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <FiLayers className="w-4 h-4" />
          <span>{t('products.allCategories', 'همه دسته‌ها')}</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              String(selectedCategory) === String(cat.id)
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span>{cat.name}</span>
            {cat.product_count !== undefined && (
              <span className="text-xs opacity-75 ms-1.5">({cat.product_count})</span>
            )}
          </button>
        ))}
      </div>

      {/* محتوای گرید محصولات */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="card h-80 animate-pulse bg-gray-200 dark:bg-gray-800"></div>
          ))}
        </div>
      ) : error ? (
        <div className="card p-8 text-center bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center text-gray-500 dark:text-gray-400">
          <FiFilter className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <h3 className="text-lg font-bold mb-1">{t('products.emptyTitle', 'هیچ کالایی یافت نشد')}</h3>
          <p className="text-sm">{t('products.emptyDesc', 'لطفاً فیلترهای جستجو یا دسته‌بندی را تغییر دهید.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id || product.slug} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
