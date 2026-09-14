import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatPrice } from '../../utils/formatters';
import api from '../../services/api';
import {
  FiPackage, FiUsers, FiShoppingCart, FiCreditCard,
  FiStar, FiMessageSquare, FiPlus, FiEdit2, FiTrash2,
  FiCheck, FiX, FiRefreshCw, FiCheckCircle
} from 'react-icons/fi';
import Button from '../../components/common/Button';

// داشبورد و پنل مدیریت جامع TechStore با پشتیبانی از دو زبان و مبالغ ریالی
const AdminDashboard = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', 'questions', 'reviews', 'users'
  const [stats, setStats] = useState({
    total_users: 0,
    total_products: 0,
    total_orders: 0,
    total_revenue: 0,
    sales_by_status: []
  });

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // وضعیت مودال ساخت/ویرایش محصول
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '1',
    price: '',
    stock: '',
    description: '',
    image_url: '',
    is_featured: 0,
    is_new: 0
  });

  // وضعیت پاسخ‌دهی به سوال
  const [answeringQuestionId, setAnsweringQuestionId] = useState(null);
  const [answerText, setAnswerText] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, prodsRes, catsRes, ordersRes, questionsRes, reviewsRes, usersRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: {} })),
        api.get('/admin/products').catch(() => ({ data: { products: [] } })),
        api.get('/categories').catch(() => ({ data: { categories: [] } })),
        api.get('/admin/orders').catch(() => ({ data: { orders: [] } })),
        api.get('/admin/questions').catch(() => ({ data: { questions: [] } })),
        api.get('/admin/reviews').catch(() => ({ data: { reviews: [] } })),
        api.get('/admin/users').catch(() => ({ data: { users: [] } }))
      ]);

      if (statsRes.success) setStats(statsRes.data || {});
      if (prodsRes.success) setProducts(prodsRes.data.products || []);
      if (catsRes.success) setCategories(catsRes.data.categories || []);
      if (ordersRes.success) setOrders(ordersRes.data.orders || []);
      if (questionsRes.success) setQuestions(questionsRes.data.questions || []);
      if (reviewsRes.success) setReviews(reviewsRes.data.reviews || []);
      if (usersRes.success) setUsersList(usersRes.data.users || []);
    } catch (err) {
      console.error('خطا در دریافت داده‌های مدیریت:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // هندلر ایجاد یا ویرایش محصول
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // آپدیت محصول
        await api.put(`/products/${editingProduct.id}`, productForm);
      } else {
        // ایجاد محصول جدید
        await api.post('/products', productForm);
      }
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        category_id: '1',
        price: '',
        stock: '',
        description: '',
        image_url: '',
        is_featured: 0,
        is_new: 0
      });
      fetchData();
    } catch (err) {
      alert(err.message || t('common.error', 'خطا در ذخیره محصول'));
    }
  };

  // حذف محصول
  const handleDeleteProduct = async (id) => {
    if (!window.confirm(language === 'fa' ? 'آیا از حذف این محصول اطمینان دارید؟' : 'Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      fetchData();
    } catch (err) {
      alert(err.message || t('common.error', 'خطا در حذف محصول'));
    }
  };

  // تایید مستقیم سفارش توسط ادمین
  const handleApproveOrder = async (orderId) => {
    try {
      const res = await api.put(`/admin/orders/${orderId}/approve`);
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      // تلاش از مسیر جایگزین
      try {
        await api.put(`/orders/${orderId}/status`, { status: 'Approved' });
        fetchData();
      } catch (err2) {
        alert(err2.message || t('common.error', 'خطا در تایید سفارش'));
      }
    }
  };

  // تغییر وضعیت سفارش
  const handleOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert(err.message || t('common.error', 'خطا در تغییر وضعیت سفارش'));
    }
  };

  // پاسخ به سوال
  const handleAnswerSubmit = async (questionId) => {
    if (!answerText.trim()) return;
    try {
      await api.put(`/admin/questions/${questionId}/answer`, { answer: answerText });
      setAnsweringQuestionId(null);
      setAnswerText('');
      fetchData();
    } catch (err) {
      alert(err.message || t('common.error', 'خطا در ثبت پاسخ'));
    }
  };

  // تایید یا حذف نظر
  const handleApproveReview = async (reviewId) => {
    try {
      await api.put(`/admin/reviews/${reviewId}/approve`);
      fetchData();
    } catch (err) {
      alert(err.message || t('common.error', 'خطا در تایید نظر'));
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm(language === 'fa' ? 'آیا از حذف این نظر اطمینان دارید؟' : 'Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      fetchData();
    } catch (err) {
      alert(err.message || t('common.error', 'خطا در حذف نظر'));
    }
  };

  // تغییر نقش کاربر
  const handleToggleUserRole = async (userId, currentRoleId) => {
    const newRoleId = currentRoleId === 1 ? 2 : 1;
    try {
      await api.put(`/admin/users/${userId}/role`, { role_id: newRoleId });
      fetchData();
    } catch (err) {
      alert(err.message || t('common.error', 'خطا در تغییر نقش کاربر'));
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* هدر پنل مدیریت */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('admin.title', 'پنل مدیریت فروشگاه')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('admin.welcome', 'خوش آمدید')}, {user?.name} {t('admin.roleAdminTitle', '(مدیر کل سیستم)')}
          </p>
        </div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <button
            onClick={fetchData}
            className="btn bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 flex items-center space-x-2 rtl:space-x-reverse text-sm"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('admin.refreshData', 'به‌روزرسانی داده‌ها')}</span>
          </button>
          <Button
            onClick={() => {
              setEditingProduct(null);
              setProductForm({
                name: '',
                category_id: categories[0]?.id || '1',
                price: '',
                stock: '10',
                description: '',
                image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
                is_featured: 1,
                is_new: 1
              });
              setShowProductModal(true);
            }}
            variant="primary"
            className="flex items-center space-x-2 rtl:space-x-reverse text-sm"
          >
            <FiPlus className="w-4 h-4" />
            <span>{t('admin.addNewProduct', 'افزودن محصول جدید')}</span>
          </Button>
        </div>
      </div>

      {/* کارت‌های آماری داشبورد */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.totalProducts', 'تعداد محصولات')}</p>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stats.total_products || products.length}</h3>
            </div>
            <div className="p-3 bg-blue-500 text-white rounded-xl shadow-md">
              <FiPackage className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.totalRevenue', 'مجموع درآمد')}</p>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                {formatPrice(stats.total_revenue || 0, language)}
              </h3>
            </div>
            <div className="p-3 bg-green-500 text-white rounded-xl shadow-md">
              <FiCreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.totalOrders', 'سفارشات کل')}</p>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stats.total_orders || orders.length}</h3>
            </div>
            <div className="p-3 bg-orange-500 text-white rounded-xl shadow-md">
              <FiShoppingCart className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.registeredUsers', 'کاربران ثبت‌نامی')}</p>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stats.total_users || usersList.length}</h3>
            </div>
            <div className="p-3 bg-purple-500 text-white rounded-xl shadow-md">
              <FiUsers className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* تب‌های مدیریت */}
      <div className="border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
        {[
          { id: 'products', label: `${t('admin.tabProducts', 'مدیریت محصولات')} (${products.length})`, icon: FiPackage },
          { id: 'orders', label: `${t('admin.tabOrders', 'سفارشات')} (${orders.length})`, icon: FiShoppingCart },
          { id: 'questions', label: `${t('admin.tabQuestions', 'پرسش و پاسخ‌ها')} (${questions.length})`, icon: FiMessageSquare },
          { id: 'reviews', label: `${t('admin.tabReviews', 'نظرات کاربران')} (${reviews.length})`, icon: FiStar },
          { id: 'users', label: `${t('admin.tabUsers', 'کاربران')} (${usersList.length})`, icon: FiUsers },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 font-semibold text-sm rounded-t-xl flex items-center space-x-2 rtl:space-x-reverse transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* محتوای تب مدیریت محصولات */}
      {activeTab === 'products' && (
        <div className="card overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-bold">
                  <th className="p-4">{t('admin.tableImage', 'تصویر')}</th>
                  <th className="p-4">{t('admin.tableName', 'نام محصول')}</th>
                  <th className="p-4">{t('admin.tableCategory', 'دسته‌بندی')}</th>
                  <th className="p-4">{t('admin.tablePrice', 'قیمت (ریال)')}</th>
                  <th className="p-4">{t('admin.tableStock', 'موجودی')}</th>
                  <th className="p-4">{t('admin.tableFeatured', 'ویژه')}</th>
                  <th className="p-4 text-center">{t('admin.tableActions', 'عملیات')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <img
                        src={prod.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'}
                        alt={prod.name}
                        className="w-12 h-12 object-contain rounded bg-white dark:bg-gray-700 p-1"
                      />
                    </td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">{prod.name}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{prod.category_name || '-'}</td>
                    <td className="p-4 font-extrabold text-primary-600 dark:text-primary-400">
                      {formatPrice(prod.price, language)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${prod.stock > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800'}`}>
                        {prod.stock} {t('admin.stockUnits', 'عدد')}
                      </span>
                    </td>
                    <td className="p-4">
                      {prod.is_featured ? (
                        <span className="badge badge-success">{t('common.yes', 'بله')}</span>
                      ) : (
                        <span className="badge badge-info">{t('common.no', 'خیر')}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => {
                            setEditingProduct(prod);
                            setProductForm({
                              name: prod.name,
                              category_id: prod.category_id,
                              price: prod.price,
                              stock: prod.stock,
                              description: prod.description,
                              image_url: prod.image_url,
                              is_featured: prod.is_featured,
                              is_new: prod.is_new
                            });
                            setShowProductModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg"
                          title={t('common.edit', 'ویرایش')}
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg"
                          title={t('common.delete', 'حذف')}
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* محتوای تب سفارشات */}
      {activeTab === 'orders' && (
        <div className="card overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold">
                  <th className="p-4">{t('admin.tableOrderNumber', 'شماره سفارش')}</th>
                  <th className="p-4">{t('admin.tableCustomer', 'مشتری')}</th>
                  <th className="p-4">{t('admin.tableTotalAmount', 'مبلغ کل')}</th>
                  <th className="p-4">{t('admin.tableStatus', 'وضعیت')}</th>
                  <th className="p-4">{t('admin.tableDate', 'تاریخ')}</th>
                  <th className="p-4 text-center">{t('admin.tableActions', 'عملیات / تایید')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-4 font-mono font-bold text-primary-600 dark:text-primary-400">{ord.order_number}</td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-900 dark:text-white">{ord.shipping_name || ord.user_name}</div>
                      <div className="text-xs text-gray-500">{ord.shipping_email || ord.user_email || ord.email}</div>
                    </td>
                    <td className="p-4 font-extrabold text-gray-900 dark:text-white">
                      {formatPrice(ord.total_amount, language)}
                    </td>
                    <td className="p-4">
                      <span className={`badge ${ord.status === 'Approved' ? 'badge-success' : ord.status === 'Pending' ? 'badge-warning' : 'badge-info'}`}>
                        {ord.status === 'Pending' ? t('orderStatus.pending.badge', 'منتظر تاییدیه ادمین') :
                         ord.status === 'Approved' ? t('orderStatus.approved.badge', 'تایید شده') :
                         ord.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">{ord.created_at}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* دکمه اختصاصی تایید سفارش */}
                        {ord.status === 'Pending' && (
                          <button
                            onClick={() => handleApproveOrder(ord.id)}
                            className="btn btn-primary text-xs py-1 px-3 flex items-center space-x-1 rtl:space-x-reverse shadow-sm bg-emerald-600 hover:bg-emerald-700"
                            title={t('admin.approveOrderBtn', 'تایید سفارش')}
                          >
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            <span>{t('admin.approveOrderBtn', 'تایید سفارش')}</span>
                          </button>
                        )}

                        <select
                          value={ord.status}
                          onChange={(e) => handleOrderStatus(ord.id, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                        >
                          <option value="Pending">Pending (در انتظار)</option>
                          <option value="Approved">Approved (تایید شده)</option>
                          <option value="Processing">Processing (در حال پردازش)</option>
                          <option value="Shipped">Shipped (ارسال شده)</option>
                          <option value="Delivered">Delivered (تحویل داده شده)</option>
                          <option value="Cancelled">Cancelled (لغو شده)</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* محتوای تب پرسش و پاسخ‌ها */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="card p-6 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-950 px-2 py-1 rounded">
                    {t('admin.productPrefix', 'محصول:')} {q.product_name || t('admin.hardware', 'سخت‌افزار')}
                  </span>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white mt-2">{q.question}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('admin.submittedBy', 'ارسال شده توسط')} {q.user_name || 'کاربر'} {t('admin.atDate', 'در')} {q.created_at}
                  </p>
                </div>
                <span className={`badge ${q.status === 'Answered' ? 'badge-success' : 'badge-warning'}`}>
                  {q.status === 'Answered' ? t('admin.statusAnswered', 'پاسخ داده شده') : t('admin.statusPendingAnswer', 'در انتظار پاسخ')}
                </span>
              </div>

              {q.answer ? (
                <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800 text-sm text-green-900 dark:text-green-200">
                  <span className="font-bold block mb-1">{t('admin.submittedAnswer', 'پاسخ ثبت شده:')}</span>
                  {q.answer}
                </div>
              ) : answeringQuestionId === q.id ? (
                <div className="space-y-2 pt-2">
                  <textarea
                    rows="3"
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder={t('admin.answerPlaceholder', 'متن پاسخ مدیر را اینجا بنویسید...')}
                    className="input text-sm"
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => handleAnswerSubmit(q.id)} variant="primary" size="sm">
                      {t('admin.submitAnswerBtn', 'ثبت پاسخ')}
                    </Button>
                    <button
                      onClick={() => setAnsweringQuestionId(null)}
                      className="btn btn-secondary text-sm py-1.5"
                    >
                      {t('common.cancel', 'انصراف')}
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    setAnsweringQuestionId(q.id);
                    setAnswerText('');
                  }}
                  variant="secondary"
                  size="sm"
                >
                  {t('admin.answerQuestionBtn', 'ثبت پاسخ به این سوال')}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* محتوای تب نظرات */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className="font-bold text-gray-900 dark:text-white">{r.user_name || 'کاربر'}</span>
                  <span className="text-yellow-400 font-bold">★ {r.rating}/5</span>
                  <span className="text-xs text-gray-500">{t('admin.forProduct', 'برای محصول:')} {r.product_name}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{r.comment}</p>
              </div>
              <div className="flex items-center gap-2">
                {!r.is_approved && (
                  <button
                    onClick={() => handleApproveReview(r.id)}
                    className="btn btn-primary text-xs py-1.5 flex items-center space-x-1 rtl:space-x-reverse"
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                    <span>{t('admin.approveReviewBtn', 'تایید نظر')}</span>
                  </button>
                )}
                <button
                  onClick={() => handleDeleteReview(r.id)}
                  className="btn btn-danger text-xs py-1.5 flex items-center space-x-1 rtl:space-x-reverse"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  <span>{t('admin.deleteReviewBtn', 'حذف')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* محتوای تب کاربران */}
      {activeTab === 'users' && (
        <div className="card overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold">
                  <th className="p-4">{t('admin.tableUserId', 'شناسه')}</th>
                  <th className="p-4">{t('admin.tableUserName', 'نام')}</th>
                  <th className="p-4">{t('admin.tableUserEmail', 'ایمیل')}</th>
                  <th className="p-4">{t('admin.tableUserRole', 'نقش فعلی')}</th>
                  <th className="p-4 text-center">{t('admin.tableChangeRole', 'عملیات تغییر نقش')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-4 font-mono">{u.id}</td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">{u.name}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{u.email}</td>
                    <td className="p-4">
                      <span className={`badge ${u.role_id === 1 || u.role_name === 'Admin' ? 'badge-danger' : 'badge-info'}`}>
                        {u.role_id === 1 || u.role_name === 'Admin' ? t('admin.badgeAdmin', 'مدیر (Admin)') : t('admin.badgeUser', 'کاربر عادی (User)')}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleUserRole(u.id, u.role_id)}
                        className="btn btn-secondary text-xs py-1 px-3"
                      >
                        {u.role_id === 1 ? t('admin.changeToUser', 'تغییر به کاربر عادی') : t('admin.changeToAdmin', 'تغییر به مدیر')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* مودال افزودن / ویرایش محصول */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingProduct ? t('admin.modalEditTitle', 'ویرایش محصول') : t('admin.modalAddTitle', 'افزودن محصول جدید')}
              </h2>
              <button onClick={() => setShowProductModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.modalProductName', 'نام محصول')}</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="input"
                  placeholder={t('admin.modalProductNamePlaceholder', 'مثال: لپ تاپ گیمینگ ایسوس')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.modalCategory', 'دسته‌بندی')}</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="input"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.modalPrice', 'قیمت به ریال')}</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="input"
                    placeholder="950000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.modalStock', 'موجودی انبار')}</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="input"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.modalImageUrl', 'لینک تصویر محصول')}</label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="input"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.modalDescription', 'توضیحات محصول')}</label>
                <textarea
                  required
                  rows="4"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="input"
                  placeholder={t('admin.modalDescPlaceholder', 'توضیحات و مشخصات سخت‌افزاری...')}
                ></textarea>
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(productForm.is_featured)}
                    onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked ? 1 : 0 })}
                    className="rounded text-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.modalFeatured', 'محصول برگزیده (Featured)')}</span>
                </label>
                <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(productForm.is_new)}
                    onChange={(e) => setProductForm({ ...productForm, is_new: e.target.checked ? 1 : 0 })}
                    className="rounded text-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.modalNew', 'محصول جدید (New)')}</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="btn btn-secondary text-sm"
                >
                  {t('admin.modalCancel', 'انصراف')}
                </button>
                <Button type="submit" variant="primary" className="text-sm">
                  {editingProduct ? t('admin.modalSubmitEdit', 'ذخیره تغییرات') : t('admin.modalSubmitNew', 'ثبت محصول')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;