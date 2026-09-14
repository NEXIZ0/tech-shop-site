<?php
namespace TechStore\Middleware;

use TechStore\Helpers\JWT;

/**
 * میدل‌ور دسترسی ویژه مدیر سیستم (Admin)
 */
class AdminMiddleware
{
    /**
     * بررسی دسترسی ادمین روی بک‌اند
     */
    public function handle(): bool
    {
        $user = $_SESSION['user'] ?? null;

        // اگه از قبل لاگین احراز نشده بود، توکن رو چک می‌کنیم
        if (!$user) {
            $authMiddleware = new AuthMiddleware();
            $token = $authMiddleware->getTokenFromRequest();

            if (!$token) {
                $this->sendResponse(401, 'برای دسترسی به این بخش باید وارد حساب کاربری شوید');
                return false;
            }

            $user = JWT::decode($token);
            if (!$user) {
                $this->sendResponse(401, 'توکن نامعتبر یا منقضی شده است');
                return false;
            }

            $_SESSION['user'] = $user;
            $_SESSION['token'] = $token;
        }

        // بررسی اینکه آیا نقش کاربر مدیر (Admin) هست یا نه
        $role = $user['role'] ?? '';
        $roleId = $user['role_id'] ?? null;

        if (strcasecmp($role, 'Admin') === 0 || $roleId === 1) {
            return true;
        }

        // اگر کاربر عادی سعی در دسترسی داشت، خطای ۴۰۳ صادر می‌شود
        $this->sendResponse(403, 'دسترسی غیرمجاز: این عملیات نیازمند دسترسی مدیریت است');
        return false;
    }

    /**
     * ارسال پاسخ خطای JSON
     */
    private function sendResponse(int $statusCode, string $message): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'message' => $message,
            'data' => null
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}