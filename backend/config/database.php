<?php
namespace TechStore\Config;

use PDO;
use PDOException;

/**
 * کلاس سینگلتون برای اتصال به پایگاه داده با PDO
 */
class Database
{
    private static ?PDO $instance = null;

    /**
     * گرفتن اتصال فعال دیتابیس
     */
    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            self::$instance = self::createConnection();
        }
        return self::$instance;
    }

    /**
     * ساخت اتصال امن با استفاده از متغیرهای محیطی
     */
    private static function createConnection(): PDO
    {
        $config = [
            'host' => getenv('DB_HOST') ?: 'database',
            'port' => getenv('DB_PORT') ?: 3306,
            'database' => getenv('DB_DATABASE') ?: 'techstore_db',
            'username' => getenv('DB_USERNAME') ?: 'techstore_user',
            'password' => getenv('DB_PASSWORD') ?: 'techstore_pass'
        ];

        try {
            $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset=utf8mb4";
            
            // اینجا اتصال PDO رو با آپشن‌های استاندارد و امن می‌سازیم
            $pdo = new PDO(
                $dsn,
                $config['username'],
                $config['password'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );

            return $pdo;
        } catch (PDOException $e) {
            // اگه دیتابیس وصل نشد ارور تمیز بدیم
            header('Content-Type: application/json; charset=utf-8');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'خطا در اتصال به پایگاه داده: ' . $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    /**
     * بستن اتصال
     */
    public static function closeConnection(): void
    {
        self::$instance = null;
    }
}