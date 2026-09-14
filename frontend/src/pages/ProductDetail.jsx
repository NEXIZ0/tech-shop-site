import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiStar, FiShoppingCart, FiChevronLeft, FiChevronRight, FiAlertCircle, FiSend, FiCheck, FiShield, FiTruck } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../utils/formatters';
import Button from '../components/common/Button';
import ProductCard from '../components/product/ProductCard';

// صفحه جزئیات محصول، مشخصات، تصاویر، نظرات و پرسش و پاسخ
const ProductDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { language, t, isRtl } = useLanguage();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [images, setImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');

  const [questionText, setQuestionText] = useState('');
  const [questionNotice, setQuestionNotice] = useState('');

  useEffect(() => {
    async function fetchProductData() {
      setLoading(true);
      try {
        const res = await api.get('/products/' + slug);
        if (res.success && res.data) {
          const prod = res.data;
          setProduct(prod);

          const imgList = (prod.images && prod.images.length > 0)
            ? prod.images.map((img) => img.image_url)
            : (prod.image_url ? [prod.image_url] : []);
          
          setImages(imgList);
          setSelectedImage(imgList[0] || prod.image_url || '');
          setRelatedProducts(prod.related || []);
        }
      } catch (err) {
        console.error('خطا در دریافت اطلاعات محصول:', err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchReviews() {
      try {
        const res = await api.get('/products/' + slug + '/reviews');
        if (res.success) {
          setReviews(res.data.reviews || []);
        }
      } catch (err) {}
    }

    async function fetchQuestions() {
      try {
        const res = await api.get('/products/' + slug + '/questions');
        if (res.success) {
          setQuestions(res.data.questions || []);
        }
      } catch (err) {}
    }

    if (slug) {
      fetchProductData();
      fetchReviews();
      fetchQuestions();
    }
  }, [slug]);

  const handleAddToCart = () => {
    if (product && product.stock > 0) {
      addToCart(product, quantity);
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 3000);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setReviewNotice('');
    try {
      const res = await api.post('/products/' + slug + '/reviews', {
        rating: reviewRating,
        comment: reviewComment
      });
      if (res.success) {
        setReviewComment('');
        setReviewNotice(t('productDetail.reviewSuccess', 'نظر شما با موفقیت ثبت شد'));
        const updated = await api.get('/products/' + slug + '/reviews');
        if (updated.success) setReviews(updated.data.reviews || []);
      }
    } catch (err) {
      setReviewNotice(err.message || t('common.error', 'خطا در ارسال نظر'));
    }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    setQuestionNotice('');
    try {
      const res = await api.post('/products/' + slug + '/questions', {
        question: questionText
      });
      if (res.success) {
        setQuestionText('');
        setQuestionNotice(t('productDetail.questionSuccess', 'پرسش شما ثبت شد و در اسرع وقت پاسخ داده می‌شود'));
        const updated = await api.get('/products/' + slug + '/questions');
        if (updated.success) setQuestions(updated.data.questions || []);
      }
    } catch (err) {
      setQuestionNotice(err.message || t('common.error', 'خطا در ارسال پرسش'));
    }
  };

  const ChevronIcon = isRtl ? FiChevronLeft : FiChevronRight;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-500">{t('productDetail.loadingProduct', 'در حال بارگذاری مشخصات محصول...')}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('productDetail.notFoundTitle', 'محصول مورد نظر یافت نشد')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{t('productDetail.notFoundDesc', 'متاسفانه چنین محصولی وجود ندارد یا حذف شده است.')}</p>
        <Link to="/products">
          <Button variant="primary">{t('productDetail.backToStore', 'بازگشت به فروشگاه')}</Button>
        </Link>
      </div>
    );
  }

  const avgRating = Number(product.rating || 4.5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* مسیر ناوبری (Breadcrumb) */}
      <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-primary-600">{t('productDetail.home', 'خانه')}</Link>
        <ChevronIcon className="w-4 h-4" />
        <Link to="/products" className="hover:text-primary-600">{t('productDetail.products', 'محصولات')}</Link>
        <ChevronIcon className="w-4 h-4" />
        <span className="text-gray-900 dark:text-white font-medium truncate">{product.name}</span>
      </div>

      {/* بخش اصلی محصول: گالری و اطلاعات خرید */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* گالری تصاویر */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card p-6 rounded-2xl flex items-center justify-center bg-white dark:bg-gray-800 shadow-md">
            <img
              src={selectedImage || product.image_url}
              alt={product.name}
              className="w-full h-80 object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-xl p-1 bg-white dark:bg-gray-800 border-2 flex-shrink-0 transition-all ${
                    selectedImage === img ? 'border-primary-600 shadow-md scale-105' : 'border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain rounded-lg" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* مشخصات اصلی، قیمت و دکمه افزودن به سبد خرید */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 rounded-full text-xs font-bold">
                {product.category_name || t('productDetail.hardware', 'سخت‌افزار')}
              </span>
              {product.is_featured ? (
                <span className="badge badge-success">{t('productDetail.featuredBadge', 'محصول ویژه')}</span>
              ) : null}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight">
              {product.name}
            </h1>
          </div>

          {/* ریتینگ */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(avgRating) ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {avgRating.toFixed(1)} / 5 ({reviews.length} {t('productDetail.ratingCount', 'نظر کاربران')})
            </span>
          </div>

          {/* قیمت و موجودی */}
          <div className="flex items-baseline space-x-4 rtl:space-x-reverse border-y border-gray-200 dark:border-gray-700 py-4">
            <span className="text-2xl sm:text-3xl font-black text-primary-600 dark:text-primary-400">
              {formatPrice(product.price, language)}
            </span>
            <span className="text-sm text-gray-500">{t('productDetail.priceNote', 'قیمت نهایی با ضمانت اصالت')}</span>
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {product.description}
          </p>

          {/* وضعیت انبار */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {product.stock > 0 ? (
              <span className="text-green-600 dark:text-green-400 text-sm font-bold flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 me-2 inline-block"></span>
                {t('productDetail.inStockStatus', 'موجود در انبار')} ({product.stock} {t('productDetail.stockRemaining', 'عدد باقی‌مانده')})
              </span>
            ) : (
              <span className="text-red-500 text-sm font-bold flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 me-2 inline-block"></span>
                {t('productDetail.outOfStockStatus', 'ناموجود در انبار')}
              </span>
            )}
          </div>

          {/* باکس انتخاب تعداد و افزودن به سبد خرید */}
          {product.stock > 0 && (
            <div className="card p-6 bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('productDetail.quantity', 'تعداد:')}</span>
                <div className="flex items-center space-x-2 rtl:space-x-reverse bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-lg text-gray-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="w-10 h-10 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handleAddToCart}
                  variant="primary"
                  size="lg"
                  className="flex-1 py-3.5 flex items-center justify-center space-x-2 rtl:space-x-reverse shadow-lg shadow-primary-600/20"
                >
                  <FiShoppingCart className="w-5 h-5" />
                  <span>{t('productDetail.addToCart', 'افزودن به سبد خرید')}</span>
                </Button>
                <Button
                  onClick={() => {
                    handleAddToCart();
                    navigate('/cart');
                  }}
                  variant="secondary"
                  size="lg"
                  className="py-3.5 px-6"
                >
                  {t('productDetail.instantBuy', 'خرید آنی')}
                </Button>
              </div>

              {addedNotice && (
                <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-xl flex items-center space-x-2 rtl:space-x-reverse animate-fade-in">
                  <FiCheck className="w-5 h-5 text-green-600" />
                  <span>{quantity} × {product.name} {t('productDetail.addedNotice', 'به سبد خرید افزوده شد!')}</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <FiShield className="w-5 h-5 text-primary-500 flex-shrink-0" />
              <span>{t('productDetail.guarantee7Days', 'ضمانت ۷ روز مهلت تست و بازگشت وجه')}</span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <FiTruck className="w-5 h-5 text-primary-500 flex-shrink-0" />
              <span>{t('productDetail.fastExpressDelivery', 'ارسال به سراسر کشور با پست پیشتاز')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* تب‌های توضیحات، مشخصات، نظرات و پرسش‌ها */}
      <div className="card overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {[
            { id: 'details', label: t('productDetail.tabDetails', 'توضیحات و مشخصات') },
            { id: 'reviews', label: `${t('productDetail.tabReviews', 'نظرات کاربران')} (${reviews.length})` },
            { id: 'questions', label: `${t('productDetail.tabQuestions', 'پرسش و پاسخ')} (${questions.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-bold text-sm transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 bg-white dark:bg-gray-800'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {/* تب توضیحات و مشخصات */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('productDetail.introTitle', 'معرفی محصول')}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                  {product.description}
                </p>
              </div>

              {product.specs && Object.keys(product.specs).length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('productDetail.specsTitle', 'مشخصات فنی')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(product.specs).map(([key, val]) => (
                      <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex justify-between text-sm">
                        <span className="font-semibold text-gray-500 dark:text-gray-400">{key}:</span>
                        <span className="font-bold text-gray-900 dark:text-white text-start">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* تب نظرات */}
          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* فرم ارسال نظر */}
              {user ? (
                <form onSubmit={handleReviewSubmit} className="card p-6 bg-gray-50 dark:bg-gray-800/50 space-y-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">{t('productDetail.submitReviewTitle', 'ثبت نظر برای این کالا')}</h3>
                  {reviewNotice && <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">{reviewNotice}</div>}

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('productDetail.yourRating', 'امتیاز شما')}</label>
                    <div className="flex space-x-1 rtl:space-x-reverse">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setReviewRating(s)}
                          className="p-1 text-yellow-400"
                        >
                          <FiStar className={`w-6 h-6 ${s <= reviewRating ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('productDetail.yourComment', 'متن نظر شما')}</label>
                    <textarea
                      required
                      rows="3"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={t('productDetail.reviewPlaceholder', 'تجربه خود را درباره کیفیت و کارایی این محصول بنویسید...')}
                      className="input text-sm"
                    />
                  </div>

                  <Button type="submit" variant="primary" size="sm" className="flex items-center space-x-2 rtl:space-x-reverse">
                    <FiSend className="w-4 h-4" />
                    <span>{t('productDetail.submitReviewBtn', 'ارسال نظر')}</span>
                  </Button>
                </form>
              ) : (
                <div className="card p-6 text-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                  {t('productDetail.loginToReview', 'برای ثبت نظر لطفاً ابتدا')}{' '}
                  <Link to="/login" className="text-primary-600 font-bold hover:underline">
                    {t('productDetail.loginLink', 'وارد حساب کاربری خود شوید')}
                  </Link>.
                </div>
              )}

              {/* لیست نظرات */}
              {reviews.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">{t('productDetail.emptyReviews', 'هنوز نظری برای این محصول ثبت نشده است.')}</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{r.user_name || 'کاربر'}</span>
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <FiStar key={s} className={`w-4 h-4 ${s <= r.rating ? 'fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{r.comment}</p>
                      <span className="text-xs text-gray-400 block">{r.created_at}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* تب پرسش و پاسخ‌ها */}
          {activeTab === 'questions' && (
            <div className="space-y-8">
              {/* فرم ارسال سوال */}
              {user ? (
                <form onSubmit={handleQuestionSubmit} className="card p-6 bg-gray-50 dark:bg-gray-800/50 space-y-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">{t('productDetail.submitQuestionTitle', 'طرح پرسش جدید')}</h3>
                  {questionNotice && <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">{questionNotice}</div>}

                  <div>
                    <textarea
                      required
                      rows="3"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder={t('productDetail.questionPlaceholder', 'پرسش خود را پیرامون سازگاری، مشخصات یا گارانتی محصول مطرح کنید...')}
                      className="input text-sm"
                    />
                  </div>

                  <Button type="submit" variant="primary" size="sm" className="flex items-center space-x-2 rtl:space-x-reverse">
                    <FiSend className="w-4 h-4" />
                    <span>{t('productDetail.submitQuestionBtn', 'ارسال پرسش')}</span>
                  </Button>
                </form>
              ) : (
                <div className="card p-6 text-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                  {t('productDetail.loginToQuestion', 'برای پرسیدن سوال لطفاً ابتدا')}{' '}
                  <Link to="/login" className="text-primary-600 font-bold hover:underline">
                    {t('productDetail.loginLink', 'وارد حساب کاربری شوید')}
                  </Link>.
                </div>
              )}

              {/* لیست سوالات */}
              {questions.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">{t('productDetail.emptyQuestions', 'تاکنون پرسشی برای این کالا مطرح نشده است.')}</p>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
                      <div>
                        <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded">
                          {t('productDetail.questionLabel', 'پرسش:')}
                        </span>
                        <p className="font-bold text-gray-900 dark:text-white text-sm mt-1">{q.question}</p>
                        <span className="text-xs text-gray-400">{t('productDetail.byUser', 'توسط')} {q.user_name || 'کاربر'}</span>
                      </div>

                      {q.answer ? (
                        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800 text-sm">
                          <span className="text-xs font-bold text-green-700 dark:text-green-300 block mb-1">
                            {t('productDetail.supportAnswer', 'پاسخ پشتیبانی:')}
                          </span>
                          <p className="text-gray-800 dark:text-gray-200">{q.answer}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">{t('productDetail.waitingAnswer', 'در انتظار پاسخ کارشناسان...')}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* محصولات مرتبط */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{t('productDetail.relatedTitle', 'محصولات مرتبط')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id || p.slug} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;