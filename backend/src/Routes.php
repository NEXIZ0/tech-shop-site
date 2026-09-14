<?php
namespace TechStore;

use TechStore\Core\Controller;
use TechStore\Core\Request;

/**
 * Route definitions
 */
class Routes
{
    /**
     * Initialize routes
     */
    public static function init(): void
    {
        // Auth routes
        self::post('/auth/login', AuthController::class, 'login');
        self::post('/auth/register', AuthController::class, 'register');
        self::get('/auth/me', AuthController::class, 'me');

        // Products
        self::get('/products', ProductController::class, 'index');
        self::get('/products/featured', ProductController::class, 'featured');
        self::get('/products/:slug', ProductController::class, 'show');
        
        // Categories
        self::get('/categories', CategoryController::class, 'index');
        
        // Admin
        self::get('/admin/products', ProductController::class, 'adminIndex');
        
        // Product reviews and questions
        self::get('/products/:slug/reviews', ProductController::class, 'getReviews');
        self::post('/products/:slug/reviews', ProductController::class, 'addReview');
        self::get('/products/:slug/questions', ProductController::class, 'getQuestions');
        self::post('/products/:slug/questions', ProductController::class, 'addQuestion');
        
        // Cart
        self::get('/cart', CartController::class, 'index');
        self::post('/cart/items', CartController::class, 'addItem');
        self::put('/cart/items/:id', CartController::class, 'updateItem');
        self::delete('/cart/items/:id', CartController::class, 'removeItem');
        
        // Orders
        self::post('/orders', OrderController::class, 'create');
        self::get('/orders', OrderController::class, 'index');
        self::get('/orders/:id', OrderController::class, 'show');
        
        // Admin - Orders
        self::get('/admin/orders', OrderController::class, 'adminIndex');
        self::put('/admin/orders/:id', OrderController::class, 'adminUpdate');
        
        // Admin - Users
        self::get('/admin/users', UserController::class, 'adminIndex');
        self::put('/admin/users/:id', UserController::class, 'adminUpdate');
        
        // Admin - Categories
        self::get('/admin/categories', CategoryController::class, 'adminIndex');
        self::post('/admin/categories', CategoryController::class, 'adminCreate');
        self::put('/admin/categories/:id', CategoryController::class, 'adminUpdate');
        self::delete('/admin/categories/:id', CategoryController::class, 'adminDelete');
        
        // Admin - Products
        self::post('/admin/products', ProductController::class, 'adminCreate');
        self::put('/admin/products/:id', ProductController::class, 'adminUpdate');
        self::delete('/admin/products/:id', ProductController::class, 'adminDelete');
    }
}