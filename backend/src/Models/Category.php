<?php
namespace TechStore\Models;

use TechStore\Core\Model;

/**
 * مدل دسته‌بندی محصولات
 */
class Category extends Model
{
    protected string $table = 'categories';

    /**
     * پیدا کردن دسته‌بندی با اسلاگ یکتا
     */
    public function findBySlug(string $slug): ?array
    {
        return $this->findBy('slug', $slug);
    }

    /**
     * دریافت لیست تمام دسته‌ها به همراه تعداد محصولات هر دسته
     */
    public function getAllWithCount(): array
    {
        $sql = "SELECT c.*, COUNT(p.id) as product_count 
                FROM {$this->table} c 
                LEFT JOIN products p ON c.id = p.category_id 
                GROUP BY c.id 
                ORDER BY c.name ASC";
        return $this->query($sql);
    }

    /**
     * دریافت دسته‌بندی‌های برتر
     */
    public function getPopular(int $limit = 8): array
    {
        $sql = "SELECT c.*, COUNT(p.id) as product_count 
                FROM {$this->table} c 
                LEFT JOIN products p ON c.id = p.category_id 
                GROUP BY c.id 
                ORDER BY product_count DESC, c.name ASC 
                LIMIT " . (int)$limit;
        return $this->query($sql);
    }
}