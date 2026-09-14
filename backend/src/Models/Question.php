<?php
namespace TechStore\Models;

use TechStore\Core\Model;

/**
 * مدل مدیریت پرسش و پاسخ‌های کاربران پیرامون محصولات
 */
class Question extends Model
{
    protected string $table = 'product_questions';

    /**
     * دریافت لیست سوالات و پاسخ‌های یک محصول
     */
    public function getProductQuestions(int $productId, int $limit = 50, int $offset = 0): array
    {
        $sql = "SELECT q.*, u.name as user_name, u.avatar 
                FROM {$this->table} q 
                LEFT JOIN users u ON q.user_id = u.id 
                WHERE q.product_id = ? 
                ORDER BY q.created_at DESC 
                LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
        return $this->query($sql, [$productId]);
    }

    /**
     * دریافت سوالات ثبت شده توسط یک کاربر
     */
    public function getUserQuestions(int $userId, int $limit = 20, int $offset = 0): array
    {
        $sql = "SELECT q.*, p.name as product_name, p.slug as product_slug 
                FROM {$this->table} q 
                LEFT JOIN products p ON q.product_id = p.id 
                WHERE q.user_id = ? 
                ORDER BY q.created_at DESC 
                LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
        return $this->query($sql, [$userId]);
    }

    /**
     * ثبت پرسش جدید توسط کاربر
     */
    public function createQuestion(array $data): int
    {
        $sql = "INSERT INTO {$this->table} (product_id, user_id, question, status) VALUES (?, ?, ?, 'Pending')";
        self::getConnection()->prepare($sql)->execute([
            $data['product_id'],
            $data['user_id'],
            $data['question']
        ]);
        return (int)self::getConnection()->lastInsertId();
    }

    /**
     * ثبت پاسخ به سوال توسط مدیر
     */
    public function answer(int $questionId, string $answer): bool
    {
        return self::getConnection()->prepare(
            "UPDATE {$this->table} SET answer = ?, status = 'Answered', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        )->execute([$answer, $questionId]);
    }

    /**
     * دریافت جزئیات یک سوال
     */
    public function getQuestionDetails(int $questionId): ?array
    {
        $sql = "SELECT q.*, p.name as product_name, p.slug as product_slug, u.name as user_name 
                FROM {$this->table} q 
                LEFT JOIN products p ON q.product_id = p.id 
                LEFT JOIN users u ON q.user_id = u.id 
                WHERE q.id = ? LIMIT 1";
        $res = $this->query($sql, [$questionId]);
        return $res[0] ?? null;
    }
}