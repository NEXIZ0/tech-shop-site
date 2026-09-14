<?php
namespace TechStore\Models;

use TechStore\Core\Model;

/**
 * مدل مدیریت سبد خرید و آیتم‌های درون آن
 */
class Cart extends Model
{
    protected string $table = 'cart';

    /**
     * دریافت سبد خرید فعال کاربر یا نشست مهمان (و ساخت آن در صورت عدم وجود)
     */
    public function getActiveCart(?int $userId = null, ?string $sessionId = null): ?array
    {
        $cart = null;

        if ($userId) {
            $sql = "SELECT c.* FROM {$this->table} c WHERE c.user_id = ? ORDER BY c.id DESC LIMIT 1";
            $cart = $this->query($sql, [$userId])[0] ?? null;
        } elseif ($sessionId) {
            $sql = "SELECT c.* FROM {$this->table} c WHERE c.session_id = ? ORDER BY c.id DESC LIMIT 1";
            $cart = $this->query($sql, [$sessionId])[0] ?? null;
        }

        if (!$cart) {
            $this->beginTransaction();
            try {
                $sess = $sessionId ?: ('sess_' . bin2hex(random_bytes(16)));
                $sql = "INSERT INTO {$this->table} (user_id, session_id) VALUES (?, ?)";
                self::getConnection()->prepare($sql)->execute([$userId, $sess]);
                $cartId = (int)self::getConnection()->lastInsertId();
                $this->commit();

                $cart = $this->find($cartId);
            } catch (\Throwable $e) {
                $this->rollBack();
                throw $e;
            }
        }

        return $cart;
    }

    /**
     * دریافت لیست اقلام موجود در سبد خرید
     */
    public function getItems(int $cartId): array
    {
        $sql = "SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, ci.created_at,
                       p.name, p.slug, p.price, p.stock, p.image_url,
                       (ci.quantity * p.price) as subtotal
                FROM cart_items ci 
                INNER JOIN products p ON ci.product_id = p.id 
                WHERE ci.cart_id = ? 
                ORDER BY ci.id ASC";
        return $this->query($sql, [$cartId]);
    }

    /**
     * افزودن محصول به سبد خرید یا افزایش تعداد در صورت وجود
     */
    public function addItem(int $cartId, int $productId, int $quantity = 1): bool
    {
        $sql = "SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? LIMIT 1";
        $existing = $this->query($sql, [$cartId, $productId])[0] ?? null;

        $this->beginTransaction();
        try {
            if ($existing) {
                $sql = "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?";
                self::getConnection()->prepare($sql)->execute([$quantity, $existing['id']]);
            } else {
                $sql = "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)";
                self::getConnection()->prepare($sql)->execute([$cartId, $productId, $quantity]);
            }
            $this->commit();
            return true;
        } catch (\Throwable $e) {
            $this->rollBack();
            return false;
        }
    }

    /**
     * به‌روزرسانی تعداد یک آیتم در سبد خرید (پشتیبانی از شناسه رکورد cart_items یا product_id)
     */
    public function updateItem(int $cartId, int $itemOrProductId, int $quantity): bool
    {
        $sql = "UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND (id = ? OR product_id = ?)";
        return self::getConnection()->prepare($sql)->execute([$quantity, $cartId, $itemOrProductId, $itemOrProductId]);
    }

    /**
     * حذف یک آیتم از سبد خرید
     */
    public function removeItem(int $cartId, int $itemOrProductId): bool
    {
        $sql = "DELETE FROM cart_items WHERE cart_id = ? AND (id = ? OR product_id = ?)";
        return self::getConnection()->prepare($sql)->execute([$cartId, $itemOrProductId, $itemOrProductId]);
    }

    /**
     * محاسبه مبلغ کل سبد خرید
     */
    public function getCartTotal(int $cartId): float
    {
        $sql = "SELECT SUM(ci.quantity * p.price) as total 
                FROM cart_items ci 
                INNER JOIN products p ON ci.product_id = p.id 
                WHERE ci.cart_id = ?";
        $result = $this->query($sql, [$cartId])[0] ?? [];
        return (float)($result['total'] ?? 0);
    }

    /**
     * پاکسازی کامل آیتم‌های سبد خرید
     */
    public function clearCart(int $cartId): bool
    {
        $sql = "DELETE FROM cart_items WHERE cart_id = ?";
        return self::getConnection()->prepare($sql)->execute([$cartId]);
    }
}