<?php
namespace TechStore\Controllers;

use TechStore\Core\Controller;
use TechStore\Core\Request;
use TechStore\Models\User;
use TechStore\Models\Product;
use TechStore\Models\Order;
use TechStore\Models\Review;
use TechStore\Models\Question;
use TechStore\Config\Database;

/**
 * کنترلر پنل مدیریت (داشبورد، مدیریت کاربران، محصولات، سفارشات، نظرات و پرسش‌ها)
 */
class AdminController extends Controller
{
    private User $userModel;
    private Product $productModel;
    private Order $orderModel;
    private Review $reviewModel;
    private Question $questionModel;

    public function __construct()
    {
        $this->userModel = new User();
        $this->productModel = new Product();
        $this->orderModel = new Order();
        $this->reviewModel = new Review();
        $this->questionModel = new Question();
    }

    /**
     * GET /api/admin/stats - دریافت آمار کلی برای داشبورد مدیریت
     */
    public function stats(Request $request): void
    {
        $sqlRevenue = "SELECT SUM(total_amount) as revenue FROM orders WHERE payment_status = 'Paid' OR status != 'Cancelled'";
        $revenueRow = Database::getConnection()->query($sqlRevenue)->fetch(\PDO::FETCH_ASSOC);

        $sqlStatus = "SELECT status, COUNT(*) as count FROM orders GROUP BY status";
        $salesByStatus = Database::getConnection()->query($sqlStatus)->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $this->success([
            'total_users' => $this->userModel->count(),
            'total_products' => $this->productModel->count(),
            'total_orders' => $this->orderModel->count(),
            'total_revenue' => (float)($revenueRow['revenue'] ?? 0),
            'sales_by_status' => $salesByStatus
        ]);
    }

    /**
     * GET /api/admin/users - لیست کاربران
     */
    public function users(Request $request): void
    {
        $limit = (int)($request->query('limit', 20) ?: 20);
        $offset = (int)($request->query('offset', 0) ?: 0);
        $users = $this->userModel->getAllWithRoles($limit, $offset);
        
        $this->success([
            'users' => $users,
            'total' => $this->userModel->count()
        ]);
    }

    /**
     * PUT /api/admin/users/:id/role - تغییر نقش کاربر
     */
    public function updateUserRole(Request $request): void
    {
        $userId = (int)$request->param('id');
        $roleId = (int)$request->data('role_id');

        if (!$userId || !$roleId) {
            $this->error('شناسه کاربر و نقش الزامی هستند', 400);
        }

        $this->userModel->update($userId, ['role_id' => $roleId]);
        $this->success(null, 'نقش کاربر با موفقیت تغییر یافت');
    }

    /**
     * PUT /api/admin/users/:id - ویرایش کاربر
     */
    public function usersEdit(Request $request): void
    {
        $userId = (int)$request->param('id');
        $data = $request->all();

        if (!$userId) {
            $this->error('شناسه کاربر الزامی است', 400);
        }

        $updateData = [];
        if (!empty($data['name'])) $updateData['name'] = trim($data['name']);
        if (!empty($data['email'])) $updateData['email'] = trim($data['email']);
        if (!empty($data['role_id'])) $updateData['role_id'] = (int)$data['role_id'];

        if (!empty($updateData)) {
            $this->userModel->update($userId, $updateData);
        }

        $this->success(null, 'اطلاعات کاربر با موفقیت به‌روزرسانی شد');
    }

    /**
     * GET /api/admin/orders - دریافت لیست تمامی سفارشات
     */
    public function orders(Request $request): void
    {
        $limit = (int)($request->query('limit', 20) ?: 20);
        $offset = (int)($request->query('offset', 0) ?: 0);

        $sql = "SELECT o.*, u.name as user_name, u.email as user_email 
                FROM orders o 
                LEFT JOIN users u ON o.user_id = u.id 
                ORDER BY o.created_at DESC 
                LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
        $stmt = Database::getConnection()->query($sql);
        $orders = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $this->success([
            'orders' => $orders,
            'total' => $this->orderModel->count()
        ]);
    }

    /**
     * GET /api/admin/orders/:id - جزئیات یک سفارش
     */
    public function orderDetail(Request $request): void
    {
        $orderId = (int)$request->param('id');
        if (!$orderId) {
            $this->error('شناسه سفارش الزامی است', 400);
        }

        $order = $this->orderModel->getOrderWithItems($orderId);
        if (!$order) {
            $this->error('سفارش مورد نظر یافت نشد', 404);
        }

        $this->success($order);
    }

    /**
     * POST/PUT /api/admin/orders/:id/approve - تایید سفارش توسط مدیر
     */
    public function orderApprove(Request $request): void
    {
        $orderId = (int)$request->param('id');
        if (!$orderId) {
            $this->error('شناسه سفارش الزامی است', 400);
        }

        $order = $this->orderModel->find($orderId);
        if (!$order) {
            $this->error('سفارش مورد نظر یافت نشد', 404);
        }

        if ($this->orderModel->approveOrder($orderId)) {
            $this->success(null, 'سفارش با موفقیت تایید شد');
        } else {
            $this->error('خطا در تایید سفارش', 500);
        }
    }

    /**
     * POST /api/admin/orders/:id/cancel - لغو سفارش توسط مدیر
     */
    public function orderCancel(Request $request): void
    {
        $orderId = (int)$request->param('id');
        if (!$orderId) {
            $this->error('شناسه سفارش الزامی است', 400);
        }

        $this->orderModel->updateStatus($orderId, 'Cancelled');
        $this->success(null, 'سفارش لغو شد');
    }

    /**
     * GET /api/admin/products - لیست محصولات برای پنل مدیریت
     */
    public function products(Request $request): void
    {
        $limit = (int)($request->query('limit', 50) ?: 50);
        $offset = (int)($request->query('offset', 0) ?: 0);

        $sql = "SELECT p.*, c.name as category_name 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id 
                ORDER BY p.created_at DESC 
                LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
        $stmt = Database::getConnection()->query($sql);
        $products = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $this->success([
            'products' => $products,
            'total' => $this->productModel->count()
        ]);
    }

    /**
     * GET /api/admin/products/:id - جزئیات محصول برای ویرایش
     */
    public function productsDetail(Request $request): void
    {
        $productId = (int)$request->param('id');
        $product = $this->productModel->find($productId);
        if (!$product) {
            $this->error('محصول یافت نشد', 404);
        }

        $sqlImages = "SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC";
        $stmtImg = Database::getConnection()->prepare($sqlImages);
        $stmtImg->execute([$productId]);
        $product['images'] = $stmtImg->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $sqlSpecs = "SELECT * FROM product_specs WHERE product_id = ?";
        $stmtSpecs = Database::getConnection()->prepare($sqlSpecs);
        $stmtSpecs->execute([$productId]);
        $product['specs'] = $stmtSpecs->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $this->success($product);
    }

    /**
     * DELETE /api/admin/products/:id - حذف محصول
     */
    public function productsDelete(Request $request): void
    {
        $productId = (int)$request->param('id');
        if (!$productId) {
            $this->error('شناسه محصول الزامی است', 400);
        }

        $this->productModel->delete($productId);
        $this->success(null, 'محصول با موفقیت حذف شد');
    }

    /**
     * GET /api/admin/reviews - لیست نظرات
     */
    public function reviews(Request $request): void
    {
        $limit = (int)($request->query('limit', 50) ?: 50);
        $offset = (int)($request->query('offset', 0) ?: 0);

        $sql = "SELECT r.*, p.name as product_name, u.name as user_name 
                FROM reviews r 
                LEFT JOIN products p ON r.product_id = p.id 
                LEFT JOIN users u ON r.user_id = u.id 
                ORDER BY r.created_at DESC 
                LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
        $stmt = Database::getConnection()->query($sql);
        $reviews = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $this->success([
            'reviews' => $reviews,
            'total' => $this->reviewModel->count()
        ]);
    }

    /**
     * PUT /api/admin/reviews/:id/approve - تایید نظر
     */
    public function reviewsApprove(Request $request): void
    {
        $reviewId = (int)$request->param('id');
        if (!$reviewId) {
            $this->error('شناسه نظر الزامی است', 400);
        }

        $this->reviewModel->approve($reviewId);
        $this->success(null, 'نظر با موفقیت تایید شد');
    }

    /**
     * DELETE /api/admin/reviews/:id - حذف نظر
     */
    public function deleteReview(Request $request): void
    {
        $reviewId = (int)$request->param('id');
        if (!$reviewId) {
            $this->error('شناسه نظر الزامی است', 400);
        }

        $this->reviewModel->delete($reviewId);
        $this->success(null, 'نظر حذف شد');
    }

    /**
     * GET /api/admin/questions - لیست سوالات
     */
    public function questions(Request $request): void
    {
        $sql = "SELECT q.*, p.name as product_name, u.name as user_name 
                FROM product_questions q 
                LEFT JOIN products p ON q.product_id = p.id 
                LEFT JOIN users u ON q.user_id = u.id 
                ORDER BY q.created_at DESC";
        $stmt = Database::getConnection()->query($sql);
        $questions = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $this->success([
            'questions' => $questions,
            'total' => count($questions)
        ]);
    }

    /**
     * PUT /api/admin/questions/:id/answer - ثبت پاسخ سوال
     */
    public function questionsAnswer(Request $request): void
    {
        $questionId = (int)$request->param('id');
        $answer = trim((string)$request->data('answer'));

        if (!$questionId || empty($answer)) {
            $this->error('شناسه سوال و متن پاسخ الزامی هستند', 400);
        }

        $this->questionModel->answer($questionId, $answer);
        $this->success(null, 'پاسخ سوال با موفقیت ثبت شد');
    }
}