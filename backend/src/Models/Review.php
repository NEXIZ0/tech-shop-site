<?php
namespace TechStore\Models;

use TechStore\Core\Model;

/**
 * مدل مدیریت نظرات و امتیازات کاربران به محصولات
 */
class Review extends Model
{
    protected string $table = 'reviews';

    /**
     * دریافت نظرات تایید شده برای یک محصول
     */
    public function getProductReviews(int $productId, int $limit = 50, int $offset = 0): array
    {
        $sql = "SELECT r.*, u.name as user_name, u.avatar 
                FROM {$this->table} r 
                LEFT JOIN users u ON r.user_id = u.id 
                WHERE r.product_id = ? AND r.is_approved = 1 
                ORDER BY r.created_at DESC 
                LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
        return $this->query($sql, [$productId]);
    }

    /**
     * دریافت نظرات ثبت شده توسط یک کاربر
     */
    public function getUserReviews(int $userId, int $limit = 20, int $offset = 0): array
    {
        $sql = "SELECT r.*, p.name as product_name, p.slug as product_slug, p.image_url 
                FROM {$this->table} r 
                LEFT JOIN products p ON r.product_id = p.id 
                WHERE r.user_id = ? 
                ORDER BY r.created_at DESC 
                LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
        return $this->query($sql, [$userId]);
    }

    /**
     * محاسبه میانگین امتیاز و تعداد نظرات یک محصول
     */
    public function getProductRating(int $productId): array
    {
        $sql = "SELECT AVG(rating) as avg_rating, COUNT(*) as review_count 
                FROM {$this->table} 
                WHERE product_id = ? AND is_approved = 1";
        $result = $this->query($sql, [$productId])[0] ?? [];
        return [
            'average' => (float)($result['avg_rating'] ?? 0),
            'count' => (int)($result['review_count'] ?? 0)
        ];
    }

    /**
     * ثبت نظر جدید و به‌روزرسانی امتیاز محصول در جدول products
     */
    public function createReview(array $data): int
    {
        $this->beginTransaction();
        try {
            $sql = "INSERT INTO {$this->table} (product_id, user_id, rating, comment, is_approved) VALUES (?, ?, ?, ?, ?)";
            self::getConnection()->prepare($sql)->execute([
                $data['product_id'],
                $data['user_id'],
                $data['rating'],
                $data['comment'],
                $data['is_approved'] ?? 1
            ]);
            $reviewId = (int)self::getConnection()->lastInsertId();
            
            // محاسبه امتیاز جدید و آپدیت جدول products
            $ratingData = $this->getProductRating((int)$data['product_id']);
            $avg = round($ratingData['average'], 2);
            $sqlUpdateProd = "UPDATE products SET rating = ? WHERE id = ?";
            self::getConnection()->prepare($sqlUpdateProd)->execute([$avg, $data['product_id']]);
            
            $this->commit();
            return $reviewId;
        } catch (\Throwable $e) {
            $this->rollBack();
            throw $e;
        }
    }

    /**
     * تایید نظر توسط مدیر
     */
    public function approve(int $reviewId): bool
    {
        return self::getConnection()->prepare(
            "UPDATE {$this->table} SET is_approved = 1 WHERE id = ?"
        )->execute([$reviewId]);
    }
}