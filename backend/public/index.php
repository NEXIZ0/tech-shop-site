<?php
// نقطه ورود اصلی TechStore REST API

// شروع سشن برای نگهداری وضعیت نشست‌ها
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// رجیستر کردن Autoloader برای کلاس‌های پروژه
spl_autoload_register(function ($class) {
    $prefix = 'TechStore\\';
    $base_dir = __DIR__ . '/../src/';
    
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    
    if (file_exists($file)) {
        require_once $file;
    }
});

// اتصال به پایگاه داده
require_once __DIR__ . '/../config/database.php';

// تنظیم هدرهای CORS برای پشتیبانی از درخواست‌های فرانت‌اند
use TechStore\Core\CORS;
CORS::apply();

// راه‌اندازی سکرت‌کی JWT
use TechStore\Helpers\JWT;
JWT::init();

// کنترلرها
use TechStore\Controllers\AuthController;
use TechStore\Controllers\ProductController;
use TechStore\Controllers\CategoryController;
use TechStore\Controllers\CartController;
use TechStore\Controllers\OrderController;
use TechStore\Controllers\ReviewController;
use TechStore\Controllers\QuestionController;
use TechStore\Controllers\UserController;
use TechStore\Controllers\AdminController;

// میدل‌ورها
use TechStore\Middleware\AuthMiddleware;
use TechStore\Middleware\AdminMiddleware;

// روتر
use TechStore\Core\Router;

// مسیرهای احراز هویت
Router::post('/api/auth/register', [AuthController::class, 'register']);
Router::post('/api/auth/login', [AuthController::class, 'login']);
Router::get('/api/auth/me', [AuthController::class, 'me'], [AuthMiddleware::class]);
Router::post('/api/auth/logout', [AuthController::class, 'logout'], [AuthMiddleware::class]);

// مسیرهای دسته‌بندی‌ها
Router::get('/api/categories/featured', [CategoryController::class, 'featured']);
Router::get('/api/categories', [CategoryController::class, 'index']);
Router::get('/api/categories/:slug', [CategoryController::class, 'show']);

// مسیرهای محصولات
Router::get('/api/products/featured', [ProductController::class, 'featured']);
Router::get('/api/products/new', [ProductController::class, 'new']);
Router::get('/api/products/search', [ProductController::class, 'search']);
Router::get('/api/products', [ProductController::class, 'index']);
Router::get('/api/products/:slug/reviews', [ReviewController::class, 'index']);
Router::post('/api/products/:slug/reviews', [ReviewController::class, 'store'], [AuthMiddleware::class]);
Router::get('/api/products/:slug/questions', [QuestionController::class, 'index']);
Router::post('/api/products/:slug/questions', [QuestionController::class, 'store'], [AuthMiddleware::class]);
Router::get('/api/products/:slug', [ProductController::class, 'show']);

// مدیریت محصولات (ویژه مدیر)
Router::post('/api/products', [ProductController::class, 'store'], [AdminMiddleware::class]);
Router::put('/api/products/:id', [ProductController::class, 'update'], [AdminMiddleware::class]);
Router::delete('/api/products/:id', [ProductController::class, 'delete'], [AdminMiddleware::class]);

// مسیرهای سبد خرید
Router::get('/api/cart', [CartController::class, 'index']);
Router::post('/api/cart/items', [CartController::class, 'addItem']);
Router::put('/api/cart/items/:id', [CartController::class, 'updateItem']);
Router::delete('/api/cart/items/:id', [CartController::class, 'removeItem']);
Router::delete('/api/cart', [CartController::class, 'clear']);

// مسیرهای سفارشات
Router::get('/api/orders', [OrderController::class, 'index'], [AuthMiddleware::class]);
Router::get('/api/orders/:id', [OrderController::class, 'show'], [AuthMiddleware::class]);
Router::post('/api/orders/checkout', [OrderController::class, 'checkout'], [AuthMiddleware::class]);
Router::put('/api/orders/:id/status', [OrderController::class, 'updateStatus'], [AdminMiddleware::class]);
Router::put('/api/orders/:id/approve', [OrderController::class, 'approve'], [AdminMiddleware::class]);

// مسیرهای پنل کاربری
Router::get('/api/user/profile', [UserController::class, 'profile'], [AuthMiddleware::class]);
Router::put('/api/user/profile', [UserController::class, 'update'], [AuthMiddleware::class]);
Router::get('/api/user/orders', [UserController::class, 'orders'], [AuthMiddleware::class]);
Router::get('/api/user/reviews', [UserController::class, 'reviews'], [AuthMiddleware::class]);
Router::put('/api/user/password', [UserController::class, 'updatePassword'], [AuthMiddleware::class]);

// مسیرهای پنل مدیریت
Router::get('/api/admin/stats', [AdminController::class, 'stats'], [AdminMiddleware::class]);
Router::get('/api/admin/users', [AdminController::class, 'users'], [AdminMiddleware::class]);
Router::put('/api/admin/users/:id/role', [AdminController::class, 'updateUserRole'], [AdminMiddleware::class]);
Router::put('/api/admin/users/:id', [AdminController::class, 'usersEdit'], [AdminMiddleware::class]);
Router::get('/api/admin/orders', [AdminController::class, 'orders'], [AdminMiddleware::class]);
Router::get('/api/admin/orders/:id', [AdminController::class, 'orderDetail'], [AdminMiddleware::class]);
Router::put('/api/admin/orders/:id/approve', [AdminController::class, 'orderApprove'], [AdminMiddleware::class]);
Router::post('/api/admin/orders/:id/approve', [AdminController::class, 'orderApprove'], [AdminMiddleware::class]);
Router::post('/api/admin/orders/:id/cancel', [AdminController::class, 'orderCancel'], [AdminMiddleware::class]);
Router::get('/api/admin/products', [AdminController::class, 'products'], [AdminMiddleware::class]);
Router::get('/api/admin/products/:id', [AdminController::class, 'productsDetail'], [AdminMiddleware::class]);
Router::delete('/api/admin/products/:id', [AdminController::class, 'productsDelete'], [AdminMiddleware::class]);
Router::get('/api/admin/reviews', [AdminController::class, 'reviews'], [AdminMiddleware::class]);
Router::put('/api/admin/reviews/:id/approve', [AdminController::class, 'reviewsApprove'], [AdminMiddleware::class]);
Router::delete('/api/admin/reviews/:id', [AdminController::class, 'deleteReview'], [AdminMiddleware::class]);
Router::get('/api/admin/questions', [AdminController::class, 'questions'], [AdminMiddleware::class]);
Router::put('/api/admin/questions/:id/answer', [AdminController::class, 'questionsAnswer'], [AdminMiddleware::class]);

// اجرای روتر و پاسخ‌دهی به درخواست
Router::dispatch();