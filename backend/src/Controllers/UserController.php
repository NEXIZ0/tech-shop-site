<?php
namespace TechStore\Controllers;

use TechStore\Core\Controller;
use TechStore\Core\Request;
use TechStore\Models\User;
use TechStore\Models\Order;
use TechStore\Models\Review;

/**
 * کنترلر مدیریت اطلاعات حساب کاربری و سوابق فعالیت کاربر
 */
class UserController extends Controller
{
    private User $userModel;
    private Order $orderModel;
    private Review $reviewModel;

    public function __construct()
    {
        $this->userModel = new User();
        $this->orderModel = new Order();
        $this->reviewModel = new Review();
    }

    /**
     * GET /api/user/profile - مشاهده اطلاعات حساب کاربری
     */
    public function profile(Request $request): void
    {
        $userId = $_SESSION['user']['user_id'] ?? null;
        if (!$userId) {
            $this->error('دسترسی غیرمجاز', 401);
        }

        $user = $this->userModel->findWithStats((int)$userId);
        if (!$user) {
            $this->error('کاربر یافت نشد', 404);
        }

        unset($user['password_hash']);
        $this->success($user);
    }

    /**
     * PUT /api/user/profile - ویرایش مشخصات پروفایل
     */
    public function update(Request $request): void
    {
        $userId = $_SESSION['user']['user_id'] ?? null;
        if (!$userId) {
            $this->error('دسترسی غیرمجاز', 401);
        }

        $updateData = [];
        if ($request->data('name')) {
            $updateData['name'] = trim((string)$request->data('name'));
        }
        if ($request->data('avatar')) {
            $updateData['avatar'] = trim((string)$request->data('avatar'));
        }

        if (empty($updateData)) {
            $this->error('هیچ فیلدی برای به‌روزرسانی ارسال نشده است', 400);
        }

        try {
            if ($this->userModel->updateProfile((int)$userId, $updateData)) {
                $user = $this->userModel->find((int)$userId);
                unset($user['password_hash']);

                if (isset($_SESSION['user']) && isset($updateData['name'])) {
                    $_SESSION['user']['name'] = $updateData['name'];
                }

                $this->success($user, 'پروفایل با موفقیت به‌روزرسانی شد');
            } else {
                $this->error('خطا در به‌روزرسانی پروفایل', 500);
            }
        } catch (\Throwable $e) {
            $this->error('خطا در به‌روزرسانی: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/user/orders - دریافت تاریخچه سفارش‌های کاربر
     */
    public function orders(Request $request): void
    {
        $userId = $_SESSION['user']['user_id'] ?? null;
        if (!$userId) {
            $this->error('دسترسی غیرمجاز', 401);
        }

        $limit = (int)($request->query('limit', 20) ?: 20);
        $offset = (int)($request->query('offset', 0) ?: 0);

        $orders = $this->orderModel->getUserOrders((int)$userId, $limit, $offset);
        foreach ($orders as &$order) {
            $full = $this->orderModel->getOrderWithItems((int)$order['id']);
            $order['items'] = $full['items'] ?? [];
            $order['payment'] = $full['payment'] ?? null;
        }

        $this->success([
            'orders' => $orders,
            'total' => $this->orderModel->getUserOrderCount((int)$userId)
        ]);
    }

    /**
     * GET /api/user/reviews - دریافت تاریخچه نظرات ثبت شده توسط کاربر
     */
    public function reviews(Request $request): void
    {
        $userId = $_SESSION['user']['user_id'] ?? null;
        if (!$userId) {
            $this->error('دسترسی غیرمجاز', 401);
        }

        $limit = (int)($request->query('limit', 20) ?: 20);
        $reviews = $this->reviewModel->getUserReviews((int)$userId, $limit, 0);

        $this->success([
            'reviews' => $reviews,
            'total' => count($reviews)
        ]);
    }

    /**
     * PUT /api/user/password - تغییر رمز عبور کاربر
     */
    public function updatePassword(Request $request): void
    {
        $userId = $_SESSION['user']['user_id'] ?? null;
        if (!$userId) {
            $this->error('دسترسی غیرمجاز', 401);
        }

        $oldPassword = (string)$request->data('old_password');
        $newPassword = (string)$request->data('new_password');

        if (empty($oldPassword) || empty($newPassword) || strlen($newPassword) < 6) {
            $this->error('رمز عبور قبلی و رمز جدید (حداقل ۶ کاراکتر) الزامی هستند', 400);
        }

        $user = $this->userModel->find((int)$userId);
        if (!$user || !password_verify($oldPassword, $user['password_hash'])) {
            $this->error('رمز عبور فعلی وارد شده نادرست است', 400);
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);

        if ($this->userModel->updatePassword((int)$userId, $newHash)) {
            $this->success(null, 'رمز عبور با موفقیت تغییر یافت');
        } else {
            $this->error('خطا در به‌روزرسانی رمز عبور', 500);
        }
    }
}