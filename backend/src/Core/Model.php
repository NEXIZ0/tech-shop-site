<?php
namespace TechStore\Core;

use PDO;
use TechStore\Config\Database;

/**
 * کلاس مدل پایه برای اجرای امن کوئری‌های پایگاه داده با استفاده از PDO
 */
abstract class Model
{
    protected string $table;
    protected string $primaryKey = 'id';

    /**
     * دریافت اتصال PDO
     */
    public static function getConnection(): PDO
    {
        return Database::getConnection();
    }

    /**
     * اجرای کوئری با Prepared Statements
     */
    public function query(string $sql, array $params = []): array
    {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * پیدا کردن یک سطر بر اساس کلید اصلی
     */
    public function find(int $id): ?array
    {
        $sql = "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = ? LIMIT 1";
        $results = $this->query($sql, [$id]);
        return $results[0] ?? null;
    }

    /**
     * پیدا کردن یک سطر بر اساس یک ستون خاص
     */
    public function findBy(string $column, mixed $value): ?array
    {
        $sql = "SELECT * FROM {$this->table} WHERE {$column} = ? LIMIT 1";
        $results = $this->query($sql, [$value]);
        return $results[0] ?? null;
    }

    /**
     * دریافت تمامی سطرها با شرایط دلخواه
     */
    public function all(array $conditions = [], string $orderBy = 'id', string $order = 'DESC', int $limit = 50, int $offset = 0): array
    {
        $sql = "SELECT * FROM {$this->table}";
        $params = [];
        
        if (!empty($conditions)) {
            $where = [];
            foreach ($conditions as $key => $value) {
                $where[] = "{$key} = ?";
                $params[] = $value;
            }
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY {$orderBy} {$order} LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
        
        return $this->query($sql, $params);
    }

    /**
     * ایجاد رکورد جدید در جدول
     */
    public function create(array $data): int
    {
        $fields = array_keys($data);
        $placeholders = array_fill(0, count($fields), '?');
        
        $sql = "INSERT INTO {$this->table} (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute(array_values($data));
        
        return (int)self::getConnection()->lastInsertId();
    }

    /**
     * به‌روزرسانی رکورد بر اساس شناسه
     */
    public function update(int $id, array $data): bool
    {
        if (empty($data)) {
            return false;
        }

        $set = [];
        $params = [];
        
        foreach ($data as $key => $value) {
            $set[] = "{$key} = ?";
            $params[] = $value;
        }
        $params[] = $id;

        $sql = "UPDATE {$this->table} SET " . implode(', ', $set) . " WHERE {$this->primaryKey} = ?";
        return self::getConnection()->prepare($sql)->execute($params);
    }

    /**
     * حذف رکورد بر اساس شناسه
     */
    public function delete(int $id): bool
    {
        $sql = "DELETE FROM {$this->table} WHERE {$this->primaryKey} = ?";
        return self::getConnection()->prepare($sql)->execute([$id]);
    }

    /**
     * شمارش تعداد رکوردها با شرایط
     */
    public function count(array $conditions = []): int
    {
        $sql = "SELECT COUNT(*) as total FROM {$this->table}";
        $params = [];
        
        if (!empty($conditions)) {
            $where = [];
            foreach ($conditions as $key => $value) {
                $where[] = "{$key} = ?";
                $params[] = $value;
            }
            $sql .= " WHERE " . implode(' AND ', $where);
        }
        
        $result = $this->query($sql, $params);
        return (int)($result[0]['total'] ?? 0);
    }

    /**
     * آغاز تراکنش
     */
    public function beginTransaction(): bool
    {
        if (!self::getConnection()->inTransaction()) {
            return self::getConnection()->beginTransaction();
        }
        return true;
    }

    /**
     * ثبت نهایی تراکنش
     */
    public function commit(): bool
    {
        if (self::getConnection()->inTransaction()) {
            return self::getConnection()->commit();
        }
        return true;
    }

    /**
     * لغو تراکنش
     */
    public function rollBack(): bool
    {
        if (self::getConnection()->inTransaction()) {
            return self::getConnection()->rollBack();
        }
        return true;
    }
}