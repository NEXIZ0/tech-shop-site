<?php
namespace TechStore\Models;

use TechStore\Core\Model;

/**
 * مدل مدیریت محصولات فروشگاه
 */
class Product extends Model
{
    protected string $table = 'products';

    /**
     * دریافت لیست محصولات همراه با اطلاعات دسته و فیلترها
     */
    public function getAllWithCategory(
        ?int $categoryId = null,
        ?string $search = null,
        ?string $sort = null,
        ?string $order = 'DESC',
        ?array $priceRange = null,
        int $limit = 20,
        int $offset = 0
    ): array {
        $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug 
                FROM {$this->table} p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE 1=1";
        $params = [];

        if ($categoryId !== null && $categoryId > 0) {
            $sql .= " AND p.category_id = ?";
            $params[] = $categoryId;
        }

        if ($search !== null && trim($search) !== '') {
            $sql .= " AND (p.name LIKE ? OR p.description LIKE ?)";
            $searchTerm = "%" . trim($search) . "%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        if ($priceRange && isset($priceRange['min']) && $priceRange['min'] > 0) {
            $sql .= " AND p.price >= ?";
            $params[] = $priceRange['min'];
        }

        if ($priceRange && isset($priceRange['max']) && $priceRange['max'] > 0) {
            $sql .= " AND p.price <= ?";
            $params[] = $priceRange['max'];
        }

        $allowedSorts = ['id', 'price', 'rating', 'created_at', 'name'];
        $sort = in_array(strtolower($sort ?? ''), $allowedSorts) ? strtolower($sort) : 'id';
        $order = strtoupper($order ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
        $sql .= " ORDER BY p.{$sort} {$order}";

        $sql .= " LIMIT " . (int)$limit . " OFFSET " . (int)$offset;

        return $this->query($sql, $params);
    }

    /**
     * پیدا کردن محصول با اسلاگ یکتا
     */
    public function findBySlug(string $slug): ?array
    {
        $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug 
                FROM {$this->table} p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE p.slug = ? LIMIT 1";
        $result = $this->query($sql, [$slug]);
        return $result[0] ?? null;
    }

    /**
     * دریافت محصولات مرتبط با یک محصول
     */
    public function getRelated(int $productId, int $limit = 4): array
    {
        // تلاش می‌کنیم محصولات با دسته‌بندی مشابه یا سایر محصولات دارای موجودی رو برگردونیم
        $product = $this->find($productId);
        $catId = $product['category_id'] ?? null;

        if ($catId) {
            $sql = "SELECT p.*, c.name as category_name 
                    FROM {$this->table} p 
                    LEFT JOIN categories c ON p.category_id = c.id 
                    WHERE p.id != ? AND p.category_id = ? AND p.stock > 0 
                    ORDER BY p.rating DESC, p.created_at DESC LIMIT " . (int)$limit;
            $items = $this->query($sql, [$productId, $catId]);
            if (!empty($items)) {
                return $items;
            }
        }

        $sql = "SELECT p.*, c.name as category_name 
                FROM {$this->table} p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE p.id != ? AND p.stock > 0 
                ORDER BY p.rating DESC LIMIT " . (int)$limit;
        return $this->query($sql, [$productId]);
    }

    /**
     * دریافت محصولات ویژه و برگزیده
     */
    public function getFeatured(int $limit = 8): array
    {
        $sql = "SELECT p.*, c.name as category_name 
                FROM {$this->table} p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE p.is_featured = 1 
                ORDER BY p.rating DESC, p.created_at DESC LIMIT " . (int)$limit;
        return $this->query($sql);
    }

    /**
     * دریافت جدیدترین محصولات
     */
    public function getNew(int $limit = 8): array
    {
        $sql = "SELECT p.*, c.name as category_name 
                FROM {$this->table} p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE p.is_new = 1 
                ORDER BY p.created_at DESC LIMIT " . (int)$limit;
        return $this->query($sql);
    }

    /**
     * محاسبه تعداد کل محصولات با در نظر گرفتن فیلترها
     */
    public function getCount(?int $categoryId = null, ?string $search = null): int
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE 1=1";
        $params = [];

        if ($categoryId !== null && $categoryId > 0) {
            $sql .= " AND category_id = ?";
            $params[] = $categoryId;
        }

        if ($search !== null && trim($search) !== '') {
            $sql .= " AND (name LIKE ? OR description LIKE ?)";
            $searchTerm = "%" . trim($search) . "%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $result = $this->query($sql, $params);
        return (int)($result[0]['count'] ?? 0);
    }

    /**
     * کاهش موجودی انبار محصول پس از خرید
     */
    public function updateStock(int $productId, int $quantity): bool
    {
        $product = $this->find($productId);
        if (!$product) {
            return false;
        }

        $newStock = max(0, (int)$product['stock'] - $quantity);
        return $this->update($productId, ['stock' => $newStock]);
    }
}