<?php
namespace TechStore\Models;

use TechStore\Core\Model;

/**
 * مدل مدیریت کاربران در دیتابیس
 */
class User extends Model
{
    protected string $table = 'users';

    /**
     * پیدا کردن کاربر با ایمیل
     */
    public function findByEmail(string $email): ?array
    {
        return $this->findBy('email', $email);
    }

    /**
     * ساخت کاربر جدید به همراه نقش مشخص (پیش‌فرض: ۲ برای User)
     */
    public function createWithRole(array $data, int $roleId = 2): int
    {
        $this->beginTransaction();
        try {
            $sql = "INSERT INTO {$this->table} (role_id, name, email, password_hash) VALUES (?, ?, ?, ?)";
            self::getConnection()->prepare($sql)->execute([
                $roleId,
                $data['name'],
                $data['email'],
                $data['password_hash']
            ]);
            $userId = (int)self::getConnection()->lastInsertId();
            $this->commit();
            return $userId;
        } catch (\Throwable $e) {
            $this->rollBack();
            throw $e;
        }
    }

    /**
     * دریافت کاربر به همراه آمار نظرات و سفارشات
     */
    public function findWithStats(int $id): ?array
    {
        $user = $this->find($id);
        if (!$user) {
            return null;
        }

        $sql = "SELECT COUNT(*) as review_count FROM reviews WHERE user_id = ?";
        $reviews = $this->query($sql, [$id])[0] ?? ['review_count' => 0];

        $sqlOrders = "SELECT COUNT(*) as order_count FROM orders WHERE user_id = ?";
        $orders = $this->query($sqlOrders, [$id])[0] ?? ['order_count' => 0];

        return array_merge($user, $reviews, $orders);
    }

    /**
     * تغییر رمز عبور کاربر
     */
    public function updatePassword(int $id, string $hashedPassword): bool
    {
        return $this->update($id, ['password_hash' => $hashedPassword]);
    }

    /**
     * به‌روزرسانی اطلاعات پروفایل کاربر
     */
    public function updateProfile(int $id, array $data): bool
    {
        $allowedFields = ['name', 'email', 'avatar'];
        $updateData = [];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }
        
        if (empty($updateData)) {
            return false;
        }
        
        return $this->update($id, $updateData);
    }

    /**
     * لیست تمام کاربران به همراه نام نقش
     */
    public function getAllWithRoles(int $limit = 20, int $offset = 0): array
    {
        $sql = "SELECT u.id, u.role_id, u.name, u.email, u.avatar, u.created_at, u.updated_at, r.name as role_name 
                FROM {$this->table} u 
                LEFT JOIN roles r ON u.role_id = r.id 
                ORDER BY u.id DESC 
                LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
        return $this->query($sql);
    }
}