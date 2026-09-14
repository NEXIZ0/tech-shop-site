# گزارش نهایی پروژه دانشگاهی فروشگاه آنلاین TechStore (FINAL REPORT)

## ۱. نمای کلی پروژه (Project Overview)
این پروژه یک پلتفرم کامل فروشگاهی سخت‌افزار کامپیوتر (TechStore) است که بر اساس معماری فول‌استک استاندارد پیاده‌سازی شده است:
- **بک‌اند (Backend):** زبان PHP 8.2 مبتنی بر الگوی MVC، سیستم روتینگ اختصاصی، دیتابیس لایر با PDO و Prepared Statements، احراز هویت مبتنی بر توکن امن JWT و میدل‌ورهای کنترل دسترسی (Auth / Admin).
- **فرانت‌اند (Frontend):** کتابخانه React 18 + Vite، استایل‌دهی مدرن با Tailwind CSS، مدیریت وضعیت با React Context و آیکون‌های متناسب با React Icons.
- **پایگاه داده (Database):** سیستم مدیریت دیتابیس MySQL 8.0 با اسکیمای جامع رابطه‌ای و کلیدهای خارجی و ایندکس‌های بهینه.
- **زیرساخت داکر (DevOps / Docker):** راه‌اندازی یکپارچه چندکانتینری با Docker Compose شامل وب‌سرور Nginx برای فرانت‌اند (با مدیریت SPA Routing)، سرور Apache/PHP برای بک‌اند و دیتابیس MySQL به همراه Seed Data خودکار.

---

## ۲. ریشه‌یابی مشکلات و باگ‌های برطرف‌شده (Root Causes & Fixed Bugs)

### پایگاه داده و داکر:
1. **ترتیب نادرست دستورات در seeds.sql:** در فایل اولیه، رکوردهای جداول وابسته (`product_images`, `product_specs`, `reviews`, `product_questions`) قبل از جداول والد (`roles`, `users`, `categories`, `products`) درج می‌شدند که منجر به خطای نقض کلید خارجی (Foreign Key Constraint Fail) می‌شد. ترتیب درج اصلاح شد.
2. **عدم اجرای seeds.sql در Docker Compose:** فایل seeds در `docker-compose.yml` ماونت نشده بود؛ با افزودن مسیر `./database/seeds.sql:/docker-entrypoint-initdb.d/02-seeds.sql:ro` دیتابیس از همان لحظه اول با داده‌های تست بالا می‌آید.
3. **هش پسوردهای تست:** پسورد حساب‌های پیش‌فرض با الگوریتم امن `PASSWORD_BCRYPT` استانداردسازی شد:
   - مدیر سیستم: `admin@techstore.com` با رمز `Admin123!`
   - کاربر عادی: `jane@example.com` با رمز `password123`

### هسته بک‌اند و احراز هویت:
4. **باگ کلاس Database PDO:** در `backend/config/database.php` خطای فراخوانی ثابت‌های PDO در نیم‌اسپیس رفع شد.
5. **باگ اعتبارسنجی امضای JWT در `JWT.php`:** تابع `isValidSignature` رشته باینری خروجی `hash_hmac` را مجدداً `base64UrlDecode` می‌کرد که باعث رد شدن تمامی توکن‌ها و از کار افتادن لاگین می‌شد. این باگ به همراه فرمول پدینگ در `base64UrlDecode` کاملاً برطرف شد.
6. **دریافت هدر Authorization در آپاچی:** تنظیمات `RewriteRule` در `.htaccess` و کلاس `Request.php` اصلاح شدند تا توکن `Bearer` در هر شرایطی بدون افت خوانده شود.
7. **کدهای وضعیت HTTP در احراز هویت:** متد لاگین در صورت اشتباه بودن رمز/ایمیل کد ۴۰۱ استاندارد صادر می‌کند و ثبت‌نام با نقش پیش‌فرض کاربر (User) انجام می‌شود.
8. **میدل‌ورهای مستقل `AuthMiddleware` و `AdminMiddleware`:** دسترسی‌های ادمین روی سطح کنترلرهای بک‌اند اعتبارسنجی می‌شوند تا هیچ کاربری نتواند به شکل دستی APIهای ادمین را فراخوانی کند.

### کنترلرها و مدل‌های بک‌اند:
9. **خطاهای سینتکس و ارجاع متد ناموجود در کنترلرها:**
   - در `OrderController.php` و `AdminController.php` خطاهای سینتکس انتهای فایل، متدهای ناقص و فراخوانی متد `getConnection()` روی آبجکت کنترلر رفع و به مدل/دیتابیس متصل شدند.
   - ساختار ستون‌های درج در `order_items` با اسکیمای اصلی جدول (`order_id, product_id, quantity, price`) همگام شد.
   - در `ReviewController.php` و `QuestionController.php` مشکل تبدیل اسلاگ متنی محصول به شناسه عددی (`id`) رفع گردید.
   - به‌روزرسانی ریتینگ محصول در جدول `products` پس از ثبت نظر اصلاح شد.
   - متد ثبت سوال در `Question.php` که به دلیل عدم تطابق تعداد پارامترهای بایند شده خطای PDO می‌داد، تصحیح شد.
   - مدل `Cart.php` و کنترلر آن به گونه‌ای به‌روز شدند که هم با `id` سطر سبد و هم با `product_id` به صورت هوشمند کار کنند.

### فرانت‌اند و کلاینت:
10. **عدم تطابق ساختار پاسخ API در فرانت:** در کامپوننت‌های `Home.jsx` و `Products.jsx` خروجی آبجکت `{ products: [...] }` و `{ categories: [...] }` مستقیماً در آرایه قرار داده می‌شد که باعث خطای `.map is not a function` و سفیدی صفحه می‌شد. این مورد با استخراج دقیق و بررسی ایمن آرایه‌ها اصلاح گردید.
11. **پیاده‌سازی کامل صفحات ناقص:**
    - صفحه سبد خرید و فرایند تسویه‌حساب (`Cart.jsx`) با قابلیت تغییر تعداد، حذف، خلاصه قیمت، محاسبه مالیات، فرم ورود آدرس و ثبت سفارش پیاده‌سازی شد.
    - پنل مدیریت (`Dashboard.jsx`) با رفع خطای سینتکس JSX به تمام APIهای بک‌اند متصل شد و امکانات کامل CRUD محصولات، مشاهده و تغییر وضعیت سفارشات، پاسخ به سوالات، تایید نظرات و تغییر نقش کاربران پیاده‌سازی گردید.
    - صفحه پروفایل و تاریخچه سفارشات (`Profile.jsx`) اضافه شد.
    - روت‌های ناوبری در `App.jsx` به طور کامل متصل شدند.
12. **تنظیم SPA Routing در Nginx:** با تنظیم `try_files $uri $uri/ /index.html;` و پروکسی معکوس شفاف به همراه فوروارد هدر `Authorization`، مشکل ۴۰۴ در رفرش صفحات حل شد.

---

## ۳. فایل‌های اصلاح‌شده یا ایجاد‌شده (Modified/Created Files)

| نام فایل | وضعیت | توضیحات |
| :--- | :--- | :--- |
| `docker-compose.yml` | اصلاح شد | ماونت اسکریپت `seeds.sql` در دیتابیس داکر |
| `database/seeds.sql` | اصلاح شد | مرتب‌سازی اینسرت‌ها، رفع خطای Foreign Key و پسوردهای هش‌شده |
| `backend/config/database.php` | اصلاح شد | رفع خطای کلاس‌های PDO و مدیریت خطا |
| `backend/src/Core/Model.php` | اصلاح شد | استانداردسازی کوئری‌ها، لیمیت‌ها و تراکنش‌ها |
| `backend/src/Core/Request.php` | اصلاح شد | استخراج مطمئن هدرها، بدنه فرم و JSON |
| `backend/src/Core/Router.php` | اصلاح شد | پاسخ‌دهی دقیق به میدل‌ورها، OPTIONS و تطبیق روت |
| `backend/src/Helpers/JWT.php` | اصلاح شد | رفع باگ اعتبارسنجی امضا، پدینگ و مدیریت نشست |
| `backend/src/Middleware/AuthMiddleware.php` | اصلاح شد | احراز هویت توکن و ارسال وضعیت ۴۰۱ |
| `backend/src/Middleware/AdminMiddleware.php` | اصلاح شد | بررسی نقش Admin در بک‌اند و ارسال ۴۰۳ |
| `backend/src/Controllers/AuthController.php` | اصلاح شد | ثبت‌نام، ورود، توکن معتبر و خروج |
| `backend/src/Controllers/ProductController.php` | اصلاح شد | لیست، ویژه، جزئیات، مشخصات، گالری و CRUD |
| `backend/src/Controllers/CategoryController.php` | اصلاح شد | لیست و دسته‌های محبوب با شمارش کالا |
| `backend/src/Controllers/CartController.php` | اصلاح شد | افزودن، ویرایش، حذف و محاسبه سبد خرید |
| `backend/src/Controllers/OrderController.php` | اصلاح شد | تسویه‌حساب، کسر موجودی، ثبت پرداخت و سوابق |
| `backend/src/Controllers/ReviewController.php` | اصلاح شد | ثبت و تایید نظر با به‌روزرسانی میانگین ریتینگ |
| `backend/src/Controllers/QuestionController.php` | اصلاح شد | پرسش و پاسخ کاربران و پاسخ‌دهی مدیر |
| `backend/src/Controllers/UserController.php` | اصلاح شد | پروفایل، ویرایش مشخصات، تغییر رمز و سوابق |
| `backend/src/Controllers/AdminController.php` | اصلاح شد | داشبورد، گزارش درآمد، مدیریت کاربران و سفارشات |
| `backend/src/Models/*.php` | اصلاح شدند | کلیه مدل‌های User, Product, Category, Cart, Order, Review, Question |
| `backend/public/index.php` | اصلاح شد | تعریف تمامی اندپوینت‌ها و میدل‌ورها |
| `backend/public/.htaccess` | اصلاح شد | ریرایت تمیز و فوروارد هدر Authorization |
| `frontend/src/App.jsx` | اصلاح شد | اضافه کردن کلیه روت‌های صفحه اصلی، سبد، ادمین و پروفایل |
| `frontend/src/pages/Home.jsx` | اصلاح شد | استخراج صحیح ریسپانس و استایل‌های مدرن |
| `frontend/src/pages/Products.jsx` | اصلاح شد | فیلتر دسته‌بندی، سرچ زنده و مرتب‌سازی |
| `frontend/src/pages/ProductDetail.jsx` | اصلاح شد | گالری عکس، مشخصات فنی، تب‌های نظرات و پرسش‌ها |
| `frontend/src/pages/Cart.jsx` | ایجاد شد | سبد خرید کامل، تغییر تعداد و فرم ثبت سفارش |
| `frontend/src/pages/Profile.jsx` | ایجاد شد | پروفایل کاربر و تاریخچه سفارش‌ها |
| `frontend/src/pages/admin/Dashboard.jsx` | اصلاح شد | رفع خطای کامپایل و پیاده‌سازی کامل پنل مدیریت |
| `frontend/src/components/layout/Navbar.jsx` | اصلاح شد | شمارنده سبد، دسترسی منوی ادمین و دارک‌مود |
| `frontend/nginx.conf` | ایجاد شد | تنظیم SPA Routing و فوروارد امن هدرها |
| `frontend/Dockerfile` | اصلاح شد | بیلد بهینه و کپی کانفیگ Nginx |

---

## ۴. راهنمای اجرا و راه‌اندازی پروژه (How to Run)

برای اجرای کامل و بدون نقص پروژه، کافی است دستور زیر را در ریشه پروژه اجرا کنید:

```bash
# بیلد و اجرای کانتینرهای داکر در پس‌زمینه
docker compose up -d --build
```

پس از بالا آمدن کانتینرها:
- **وب‌سایت فرانت‌اند و فروشگاه:** در آدرس `http://localhost`
- **اندپوینت‌های بک‌اند API:** در آدرس `http://localhost/api`
- **پنل مدیریت:** در مسیر `http://localhost/admin`

### اطلاعات حساب‌های پیش‌فرض تست:
- **حساب مدیر (Admin):**
  - ایمیل: `admin@techstore.com`
  - رمز عبور: `Admin123!`
- **حساب کاربر عادی (User):**
  - ایمیل: `jane@example.com`
  - رمز عبور: `password123`
