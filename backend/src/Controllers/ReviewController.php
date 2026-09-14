<?php
namespace TechStore\Controllers;

use TechStore\Core\Controller;
use TechStore\Core\Request;
use TechStore\Models\Review;
use TechStore\Models\Product;
use TechStore\Config\Database;

/**
 * کنترلر مدیریت نظرات و امتیازات محصولات
 */
class ReviewController extends Controller
{
    private Review $reviewModel;
    private Product $productModel;

    public function __construct()
    {
        $this->reviewModel = new Review();
        $this->productModel = new Product();
    }

    /**
     * GET /api/products/:slug/reviews - دریافت لیست نظرات تایید شده یک محصول
     */
    public function index(Request $request): void
    {
        $slug = $request->param('slug');
        if (!$slug) {
            $this->error('اسلاگ محصول الزامی است', 400);
        }

        $product = $this->productModel->findBySlug($slug);
        if (!$product) {
            $this->error('محصول مورد نظر یافت نشد', 404);
        }

        $limit = (int)($request->query('limit', 50) ?: 50);
        $offset = (int)($request->query('offset', 0) ?: 0);

        $reviews = $this->reviewModel->getProductReviews((int)$product['id'], $limit, $offset);
        $ratingInfo = $this->reviewModel->getProductRating((int)$product['id']);

        $this->success([
            'reviews' => $reviews,
            'total' => count($reviews),
            'rating' => $ratingInfo
        ]);
    }

    /**
     * POST /api/products/:slug/reviews - ثبت نظر جدید برای محصول
     */
    public function store(Request $request): void
    {
        $userId = $_SESSION['user']['user_id'] ?? null;
        if (!$userId) {
            $this->error('برای ثبت نظر باید وارد حساب کاربری خود شوید', 401);
        }

        $slug = $request->param('slug');
        if (!$slug) {
            $this->error('اسلاگ محصول الزامی است', 400);
        }

        $product = $this->productModel->findBySlug($slug);
        if (!$product) {
            $this->error('محصول مورد نظر یافت نشد', 404);
        }

        $rating = (int)$request->data('rating');
        $comment = trim((string)$request->data('comment'));

        if ($rating < 1 || $rating > 5 || empty($comment)) {
            $this->error('امتیاز بین ۱ تا ۵ و متن نظر الزامی است', 400);
        }

        $productId = (int)$product['id'];

        // بررسی اینکه آیا کاربر قبلا برای این محصول نظر ثبت کرده یا نه
        $sqlCheck = "SELECT id FROM reviews WHERE product_id = ? AND user_id = ? LIMIT 1";
        $stmt = Database::getConnection()->prepare($sqlCheck);
        $stmt->execute([$productId, $userId]);
        if ($stmt->fetch()) {
            $this->error('شما قبلاً برای این محصول نظر ثبت کرده‌اید', 400);
        }

        try {
            $reviewId = $this->reviewModel->createReview([
                'product_id' => $productId,
                'user_id' => (int)$userId,
                'rating' => $rating,
                'comment' => $comment,
                'is_approved' => 1
            ]);

            $this->success([
                'review_id' => $reviewId
            ], 'نظر شما با موفقیت ثبت شد');
        } catch (\Throwable $e) {
            $this->error('خطا در ثبت نظر: ' . $e->getMessage(), 500);
        }
    }
}