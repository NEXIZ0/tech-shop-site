<?php
namespace TechStore\Core;

/**
 * سیستم روتینگ REST API برای هدایت درخواست‌ها به کنترلرها
 */
class Router
{
    private static array $routes = [];

    public static function get(string $pattern, callable|array $handler, ?array $middleware = null): void
    {
        self::addRoute("GET", $pattern, $handler, $middleware);
    }

    public static function post(string $pattern, callable|array $handler, ?array $middleware = null): void
    {
        self::addRoute("POST", $pattern, $handler, $middleware);
    }

    public static function put(string $pattern, callable|array $handler, ?array $middleware = null): void
    {
        self::addRoute("PUT", $pattern, $handler, $middleware);
    }

    public static function delete(string $pattern, callable|array $handler, ?array $middleware = null): void
    {
        self::addRoute("DELETE", $pattern, $handler, $middleware);
    }

    public static function options(string $pattern, callable|array $handler): void
    {
        self::addRoute("OPTIONS", $pattern, $handler, []);
    }

    private static function addRoute(string $method, string $pattern, callable|array $handler, ?array $middleware = null): void
    {
        self::$routes[] = [
            "method" => strtoupper($method),
            "pattern" => $pattern,
            "handler" => $handler,
            "middleware" => $middleware ?? []
        ];
    }

    /**
     * پردازش و توزیع درخواست جاری به کنترلر مربوطه
     */
    public static function dispatch(): void
    {
        $requestUri = parse_url($_SERVER["REQUEST_URI"] ?? '/', PHP_URL_PATH) ?? '/';
        $requestMethod = strtoupper($_SERVER["REQUEST_METHOD"] ?? 'GET');

        // حذف پسوند اسلش انتهایی جهت تطابق بهتر
        if ($requestUri !== '/' && str_ends_with($requestUri, '/')) {
            $requestUri = rtrim($requestUri, '/');
        }

        // پاسخ‌دهی به درخواست‌های Preflight مربوط به CORS
        if ($requestMethod === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        foreach (self::$routes as $route) {
            if ($route["method"] !== $requestMethod) {
                continue;
            }

            $pattern = $route["pattern"];
            if ($pattern !== '/' && str_ends_with($pattern, '/')) {
                $pattern = rtrim($pattern, '/');
            }

            // تبدیل پلیس‌هولدرهای :param یا {param} به Regex Capture Group
            $regex = preg_replace("/\{([a-zA-Z0-9_]+)\}/", "(?P<$1>[^/]+)", $pattern);
            $regex = preg_replace("/:([a-zA-Z0-9_]+)/", "(?P<$1>[^/]+)", $regex);
            $regex = "#^" . $regex . "$#i";

            if (preg_match($regex, $requestUri, $matches)) {
                // اجرای میدل‌ورهای تعریف‌شده برای روت
                foreach ($route["middleware"] as $middlewareClass) {
                    $middlewareInstance = new $middlewareClass();
                    if (!$middlewareInstance->handle()) {
                        // میدل‌ور خودش پیام خطا و وضعیت مناسب رو ارسال و خروج می‌کنه
                        return;
                    }
                }

                // استخراج پارامترهای روت (مثلا slug یا id)
                $params = [];
                foreach ($matches as $key => $value) {
                    if (is_string($key)) {
                        $params[$key] = urldecode($value);
                    }
                }

                $request = new Request();
                foreach ($params as $k => $v) {
                    $request->setParam($k, $v);
                }

                $handler = $route["handler"];
                if (is_array($handler)) {
                    [$controllerClass, $method] = $handler;
                    $controller = new $controllerClass();
                    call_user_func([$controller, $method], $request);
                } elseif (is_callable($handler)) {
                    call_user_func($handler, $request);
                }
                return;
            }
        }

        // اگر روتی پیدا نشد پاسخ ۴۰۴ بازگردانده می‌شود
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'message' => 'مسیر مورد نظر یافت نشد (Route not found)',
            'data' => null
        ], JSON_UNESCAPED_UNICODE);
    }
}
