<?php
namespace TechStore\Middleware;

use TechStore\Helpers\JWT;

/**
 * میدل‌ور احراز هویت برای روت‌های محافظت‌شده
 */
class AuthMiddleware
{
    /**
     * بررسی اعتبارسنجی لاگین کاربر با JWT
     */
    public function handle(): bool
    {
        $token = $this->getTokenFromRequest();
        
        if (!$token) {
            $this->sendUnauthorized('توکن احراز هویت یافت نشد');
            return false;
        }

        $user = JWT::decode($token);
        
        if (!$user) {
            $this->sendUnauthorized('توکن نامعتبر یا منقضی شده است');
            return false;
        }

        // اطلاعات کاربر لاگین شده رو توی سشن ذخیره می‌کنیم تا کنترلرها بتونن بخونن
        $_SESSION['user'] = $user;
        $_SESSION['token'] = $token;
        
        return true;
    }

    /**
     * استخراج توکن Bearer از هدر درخواست
     */
    public function getTokenFromRequest(): ?string
    {
        $authHeader = '';

        // ۱. تلاش برای خواندن از هدرهای استاندارد آپاچی
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            foreach ($headers as $key => $val) {
                if (strcasecmp($key, 'authorization') === 0) {
                    $authHeader = $val;
                    break;
                }
            }
        }

        // ۲. تلاش برای خواندن از متغیرهای $_SERVER
        if (empty($authHeader)) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        }

        if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
            return $matches[1];
        }

        // ۳. پشتیبانی از ارسال پارامتر توکن در کوئری
        if (!empty($_GET['token'])) {
            return (string)$_GET['token'];
        }

        // ۴. بررسی سشن از قبل موجود
        if (!empty($_SESSION['token'])) {
            return (string)$_SESSION['token'];
        }

        return null;
    }

    /**
     * ارسال خطای ۴۰۱ استاندارد
     */
    private function sendUnauthorized(string $message): void
    {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'message' => $message,
            'data' => null
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}