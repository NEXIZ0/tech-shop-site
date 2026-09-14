<?php
namespace TechStore\Controllers;

use TechStore\Core\Controller;
use TechStore\Core\Request;
use TechStore\Models\Category;

/**
 * کنترلر دسته‌بندی محصولات
 */
class CategoryController extends Controller
{
    private Category $categoryModel;

    public function __construct()
    {
        $this->categoryModel = new Category();
    }

    /**
     * GET /api/categories - دریافت لیست تمامی دسته‌بندی‌ها
     */
    public function index(Request $request): void
    {
        $categories = $this->categoryModel->getAllWithCount();
        $this->success([
            'categories' => $categories,
            'total' => count($categories)
        ]);
    }

    /**
     * GET /api/categories/:slug - دریافت جزئیات یک دسته‌بندی
     */
    public function show(Request $request): void
    {
        $slug = $request->param('slug');
        if (!$slug) {
            $this->error('اسلاگ دسته‌بندی الزامی است', 400);
        }

        $category = $this->categoryModel->findBySlug($slug);
        if (!$category) {
            $this->error('دسته‌بندی مورد نظر یافت نشد', 404);
        }

        $this->success($category);
    }

    /**
     * GET /api/categories/featured - دریافت دسته‌بندی‌های برگزیده و محبوب
     */
    public function featured(Request $request): void
    {
        $limit = (int)($request->query('limit', 8) ?: 8);
        $categories = $this->categoryModel->getPopular($limit);
        $this->success([
            'categories' => $categories,
            'total' => count($categories)
        ]);
    }
}