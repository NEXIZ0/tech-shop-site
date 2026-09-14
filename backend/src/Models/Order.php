<?php
namespace TechStore\Models;

use TechStore\Core\Model;

/**
 * مدل مدیریت سفارشات و اقلام خریداری شده
 */
class Order extends Model
{
    protected string $table = 'orders';

    /**
     * پیدا کردن سفارش با شماره سفارش
     */
    public function findByOrderNumber(string $orderNumber): ?array
    {
        return $this->findBy('order_number', $orderNumber);
    }

    /**
     * دریافت لیست سفارش‌های یک کاربر خاص
     */
    public function getUserOrders(int $userId, int $limit = 20, int $offset = 0): array
    {
        $sql = "SELECT * FROM {$this->table} WHERE user_id = ? ORDER BY created_at DESC LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
        return $this->query($sql, [$userId]);
    }

    /**
     * دریافت جزئیات یک سفارش به همراه اقلام و تراکنش پرداخت
     */
    public function getOrderWithItems(int $orderId): ?array
    {
        $sql = "SELECT o.*, u.name as user_name, u.email as user_email 
                FROM {$this->table} o 
                LEFT JOIN users u ON o.user_id = u.id 
                WHERE o.id = ? LIMIT 1";
        $order = $this->query($sql, [$orderId])[0] ?? null;
        
        if (!$order) {
            return null;
        }

        // اقلام سفارش مطابق با اسکیما (order_id, product_id, quantity, price)
        $sqlItems = "SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price,
                            p.name as product_name, p.slug as product_slug, p.image_url 
                     FROM order_items oi 
                     LEFT JOIN products p ON oi.product_id = p.id 
                     WHERE oi.order_id = ?";
        $order['items'] = $this->query($sqlItems, [$orderId]);

        // تراکنش پرداخت مربوطه
        $sqlPayment = "SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1";
        $order['payment'] = $this->query($sqlPayment, [$orderId])[0] ?? null;

        return $order;
    }

    /**
     * ثبت اطلاعات اولیه سفارش
     */
    public function createOrder(array $data): int
    {
        $fields = [
            'user_id', 'order_number', 'total_amount', 'status', 'payment_status',
            'shipping_name', 'shipping_email', 'shipping_phone', 'shipping_address',
            'city', 'postal_code', 'notes'
        ];

        $insertData = [];
        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                $insertData[$field] = $data[$field];
            }
        }

        return $this->create($insertData);
    }

    /**
     * افزودن یک قلم کالا به سفارش در جدول order_items
     */
    public function addOrderItem(int $orderId, int $productId, int $quantity, float $price): bool
    {
        $sql = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)";
        return self::getConnection()->prepare($sql)->execute([$orderId, $productId, $quantity, $price]);
    }

    /**
     * به‌روزرسانی وضعیت سفارش (مانند Pending, Approved, Processing, Shipped, Delivered, Cancelled)
     */
    public function updateStatus(int $orderId, string $status): bool
    {
        $allowedStatuses = ['Pending', 'Approved', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!in_array($status, $allowedStatuses)) {
            return false;
        }
        return $this->update($orderId, ['status' => $status]);
    }

    /**
     * تایید سفارش توسط مدیر
     */
    public function approveOrder(int $orderId): bool
    {
        return $this->update($orderId, [
            'status' => 'Approved',
            'payment_status' => 'Approved'
        ]);
    }

    /**
     * تعداد کل سفارش‌های یک کاربر
     */
    public function getUserOrderCount(int $userId): int
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE user_id = ?";
        $result = $this->query($sql, [$userId])[0] ?? [];
        return (int)($result['count'] ?? 0);
    }
}