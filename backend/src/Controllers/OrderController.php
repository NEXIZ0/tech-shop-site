<?php
namespace TechStore\Controllers;

use TechStore\Core\Controller;
use TechStore\Core\Request;
use TechStore\Models\Order;
use TechStore\Models\Product;
use TechStore\Models\Cart;
use TechStore\Config\Database;

/**
 * کنترلر ثبت و مدیریت سفارشات و فرایند تسویه‌حساب (Checkout)
 */
class OrderController extends Controller
{
    private Order $orderModel;
    private Product $productModel;
    private Cart $cartModel;

    public function __construct()
    {
        $this->orderModel = new Order();
        $this->productModel = new Product();
        $this->cartModel = new Cart();
    }

    /**
     * GET /api/orders - دریافت لیست سفارش‌های کاربر جاری
     */
    public function index(Request $request): void
    {
        $userId = $_SESSION['user']['user_id'] ?? null;
        if (!$userId) {
            $this->error('دسترسی غیرمجاز', 401);
        }

        $limit = (int)($request->query('limit', 20) ?: 20);
        $offset = (int)($request->query('offset', 0) ?: 0);

        $orders = $this->orderModel->getUserOrders((int)$userId, $limit, $offset);
        $count = $this->orderModel->getUserOrderCount((int)$userId);

        foreach ($orders as &$order) {
            $full = $this->orderModel->getOrderWithItems((int)$order['id']);
            $order['items'] = $full['items'] ?? [];
            $order['payment'] = $full['payment'] ?? null;
        }

        $this->success([
            'orders' => $orders,
            'total' => $count,
            'limit' => $limit,
            'offset' => $offset
        ]);
    }

    /**
     * GET /api/orders/:id - دریافت جزئیات یک سفارش
     */
    public function show(Request $request): void
    {
        $userId = $_SESSION['user']['user_id'] ?? null;
        if (!$userId) {
            $this->error('دسترسی غیرمجاز', 401);
        }

        $orderId = (int)$request->param('id');
        if (!$orderId) {
            $this->error('شناسه سفارش الزامی است', 400);
        }

        $order = $this->orderModel->getOrderWithItems($orderId);
        if (!$order) {
            $this->error('سفارش مورد نظر یافت نشد', 404);
        }

        $userRole = $_SESSION['user']['role'] ?? '';
        // کاربر فقط به سفارش‌های خودش یا اگر مدیر باشد به همه سفارش‌ها دسترسی دارد
        if ((int)$order['user_id'] !== (int)$userId && strcasecmp($userRole, 'Admin') !== 0) {
            $this->error('دسترسی به این سفارش برای شما مجاز نیست', 403);
        }

        $this->success($order);
    }

    /**
     * POST /api/orders/checkout - تسویه حساب و نهایی‌سازی خرید
     */
    public function checkout(Request $request): void
    {
        $userId = $_SESSION['user']['user_id'] ?? null;
        if (!$userId) {
            $this->error('برای ثبت سفارش باید وارد حساب کاربری شوید', 401);
        }

        $data = $request->all();
        if (!$this->validateRequired($data, [
            'shipping_name', 'shipping_email', 'shipping_phone',
            'shipping_address', 'city', 'postal_code'
        ])) {
            $this->error('تمامی فیلدهای مربوط به آدرس و مشخصات تحویل‌گیرنده الزامی هستند', 400);
        }

        $sessionId = session_id() ?: ($_COOKIE['PHPSESSID'] ?? 'sess_default');
        $cart = $this->cartModel->getActiveCart((int)$userId, $sessionId);
        
        if (!$cart) {
            $this->error('سبد خرید شما خالی است', 400);
        }

        $cartId = (int)$cart['id'];
        $items = $this->cartModel->getItems($cartId);

        if (empty($items)) {
            $this->error('سبد خرید شما خالی است و هیچ کالایی جهت ثبت سفارش وجود ندارد', 400);
        }

        // بررسی موجودی انبار برای همه اقلام قبل از شروع ثبت
        $totalAmount = 0;
        foreach ($items as $item) {
            $product = $this->productModel->find((int)$item['product_id']);
            if (!$product) {
                $this->error("کالای {$item['name']} یافت نشد", 400);
            }
            if ((int)$product['stock'] < (int)$item['quantity']) {
                $this->error("موجودی کالای {$item['name']} در انبار کافی نیست (موجودی: {$product['stock']})", 400);
            }
            $totalAmount += (float)$product['price'] * (int)$item['quantity'];
        }

        // تولید شماره سفارش یکتا
        $orderNumber = 'TS-ORD-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));

        $this->orderModel->beginTransaction();

        try {
            // ۱. ایجاد رکورد در جدول orders با وضعیت اولیه در انتظار تایید مدیر
            $orderId = $this->orderModel->createOrder([
                'user_id' => (int)$userId,
                'order_number' => $orderNumber,
                'total_amount' => $totalAmount,
                'status' => 'Pending',
                'payment_status' => 'Pending',
                'shipping_name' => trim($data['shipping_name']),
                'shipping_email' => trim($data['shipping_email']),
                'shipping_phone' => trim($data['shipping_phone']),
                'shipping_address' => trim($data['shipping_address']),
                'city' => trim($data['city']),
                'postal_code' => trim($data['postal_code']),
                'notes' => isset($data['notes']) ? trim($data['notes']) : null
            ]);

            // ۲. ایجاد رکوردهای اقلام در جدول order_items و کسر موجودی انبار
            foreach ($items as $item) {
                $this->orderModel->addOrderItem(
                    $orderId,
                    (int)$item['product_id'],
                    (int)$item['quantity'],
                    (float)$item['price']
                );

                // کسر موجودی انبار
                $this->productModel->updateStock((int)$item['product_id'], (int)$item['quantity']);
            }

            // ۳. ایجاد رکورد پرداخت به عنوان در انتظار بررسی
            $transactionId = 'ORD-' . strtoupper(bin2hex(random_bytes(6)));
            $paymentMethod = $data['payment_method'] ?? 'ثبت مستقیم سفارش (نیازمند تایید مدیر)';
            
            $sqlPayment = "INSERT INTO payments (order_id, payment_method, transaction_id, amount, status) VALUES (?, ?, ?, ?, 'Pending')";
            Database::getConnection()->prepare($sqlPayment)->execute([
                $orderId,
                $paymentMethod,
                $transactionId,
                $totalAmount
            ]);

            // ۴. پاکسازی اقلام سبد خرید
            $this->cartModel->clearCart($cartId);

            $this->orderModel->commit();

            $fullOrder = $this->orderModel->getOrderWithItems($orderId);

            $this->success([
                'order' => $fullOrder,
                'order_number' => $orderNumber,
                'order_id' => $orderId,
                'total_amount' => $totalAmount,
                'status' => 'Pending'
            ], 'سفارش شما با موفقیت ثبت شد و منتظر تاییدیه ادمین است.');
        } catch (\Throwable $e) {
            $this->orderModel->rollBack();
            $this->error('خطا در نهایی‌سازی سفارش: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/orders/:id/status - تغییر وضعیت سفارش توسط مدیر
     */
    public function updateStatus(Request $request): void
    {
        $orderId = (int)$request->param('id');
        $status = trim((string)$request->data('status'));

        if (!$orderId || empty($status)) {
            $this->error('شناسه سفارش و وضعیت جدید الزامی هستند', 400);
        }

        $order = $this->orderModel->find($orderId);
        if (!$order) {
            $this->error('سفارش مورد نظر یافت نشد', 404);
        }

        if ($this->orderModel->updateStatus($orderId, $status)) {
            if ($status === 'Approved') {
                Database::getConnection()->prepare("UPDATE orders SET payment_status = 'Approved' WHERE id = ?")->execute([$orderId]);
            }
            $this->success(null, 'وضعیت سفارش با موفقیت به‌روزرسانی شد');
        } else {
            $this->error('وضعیت نامعتبر است یا خطا در به‌روزرسانی رخ داد', 400);
        }
    }

    /**
     * PUT /api/admin/orders/:id/approve یا PUT /api/orders/:id/approve - تایید سفارش توسط مدیر
     */
    public function approve(Request $request): void
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
}