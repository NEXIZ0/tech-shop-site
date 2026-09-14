import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiStar } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatPrice } from '../../utils/formatters';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { language, t } = useLanguage();

  return (
    <div className="card group overflow-hidden flex flex-col h-full hover:shadow-lg transition-all duration-300">
      {/* Image container */}
      <div className="relative pt-[75%] bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
        {product.is_featured ? (
          <span className="absolute top-2 left-2 badge badge-info">
            {t('products.featuredBadge', 'ویژه')}
          </span>
        ) : null}
        {product.stock <= 0 && (
          <span className="absolute top-2 right-2 badge badge-danger">
            {t('products.outOfStockBadge', 'ناموجود')}
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
            {product.category_name || t('productDetail.hardware', 'سخت‌افزار')}
          </span>
          <Link to={`/products/${product.slug}`}>
            <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mt-1">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="mt-4">
          {/* Rating */}
          <div className="flex items-center space-x-1 rtl:space-x-reverse mb-2">
            <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {product.rating ? Number(product.rating).toFixed(1) : '4.5'}
            </span>
          </div>

          {/* Price & Action */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <div>
              <span className="text-base sm:text-lg font-extrabold text-primary-600 dark:text-primary-400">
                {formatPrice(product.price, language)}
              </span>
            </div>

            <button
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className="btn btn-primary btn-sm flex items-center space-x-1 rtl:space-x-reverse"
              title={t('products.addToCart', 'افزودن به سبد')}
            >
              <FiShoppingCart className="w-4 h-4" />
              <span>{t('products.addToCart', 'افزودن')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;