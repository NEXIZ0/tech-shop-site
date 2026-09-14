<?php
namespace TechStore\Helpers;

/**
 * کلاس مدیریت JWT برای احراز هویت توکن‌ها
 */
class JWT
{
    private static string $secret;

    public static function init(): void
    {
        // سکرت‌کی رو از محیط می‌گیریم یا یه پیش‌فرض امن می‌ذاریم
        self::$secret = getenv('JWT_SECRET') ?: 'super_secret_jwt_key_techstore_2026_uniproject';
    }

    /**
     * ساخت توکن JWT برای یوزر
     */
    public static function encode(array $payload): string
    {
        self::init();
        
        $header = json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256'
        ]);

        $payload['iat'] = time();
        $payload['exp'] = time() + (86400 * 7); // انقضا تا ۷ روز

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac(
            'sha256',
            $base64UrlHeader . "." . $base64UrlPayload,
            self::$secret,
            true
        );

        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * دیکود و اعتبارسنجی توکن
     */
    public static function decode(string $token): ?array
    {
        self::init();
        
        try {
            $token = trim($token);
            $tokenParts = explode('.', $token);
            
            if (count($tokenParts) !== 3) {
                return null;
            }

            [$header, $payload, $signature] = $tokenParts;

            // محاسبه امضای مورد انتظار
            $expectedSignatureRaw = hash_hmac(
                'sha256',
                $header . "." . $payload,
                self::$secret,
                true
            );
            $expectedSignature = self::base64UrlEncode($expectedSignatureRaw);

            // تطبیق امضا با مقایسه رشته‌های base64url
            if (!hash_equals($expectedSignature, $signature)) {
                return null;
            }

            $payloadJson = self::base64UrlDecode($payload);
            $decoded = json_decode($payloadJson, true);
            
            if (!is_array($decoded)) {
                return null;
            }

            // چک کردن تاریخ انقضا
            if (isset($decoded['exp']) && $decoded['exp'] < time()) {
                return null;
            }

            return $decoded;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * اعتبارسنجی توکن و بازگرداندن دیتای یوزر
     */
    public static function validate(string $token): ?array
    {
        return self::decode($token);
    }

    /**
     * چک کردن معتبر بودن توکن
     */
    public static function isValid(string $token): bool
    {
        return self::decode($token) !== null;
    }

    public static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    public static function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $padLen = 4 - $remainder;
            $data .= str_repeat('=', $padLen);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }
}