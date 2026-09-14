<?php
namespace TechStore\Core;

/**
 * کلاس پردازش و مدیریت درخواست‌های HTTP
 */
class Request
{
    private array $query;
    private array $params;
    private array $data;
    private string $method;
    private array $headers;

    public function __construct()
    {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $this->query = $_GET ?? [];
        $this->params = []; // پارامترهای روت مثل :slug یا :id
        
        // استخراج تمام هدرها و نرمال‌سازی کلیدها به حروف کوچک
        $this->headers = $this->extractAllHeaders();

        // خواندن و پارس بدنه درخواست
        $rawInput = file_get_contents('php://input');
        $jsonData = json_decode($rawInput, true);

        if (is_array($jsonData)) {
            $this->data = $jsonData;
        } else if (!empty($_POST)) {
            $this->data = $_POST;
        } else {
            $this->data = [];
        }
    }

    /**
     * استخراج تمامی هدرها به همراه هدرهای آپاچی و سرور
     */
    private function extractAllHeaders(): array
    {
        $headers = [];

        if (function_exists('getallheaders')) {
            $rawHeaders = getallheaders();
            if (is_array($rawHeaders)) {
                foreach ($rawHeaders as $key => $val) {
                    $headers[strtolower($key)] = $val;
                }
            }
        }

        // بررسی متغیرهای سرور در صورتی که آپاچی هدر رو مستقیم ست کرده باشه
        foreach ($_SERVER as $key => $val) {
            if (str_starts_with($key, 'HTTP_')) {
                $headerName = strtolower(str_replace('_', '-', substr($key, 5)));
                if (!isset($headers[$headerName])) {
                    $headers[$headerName] = $val;
                }
            }
        }

        // پوشش اختصاصی برای هدر Authorization در آپاچی
        if (!isset($headers['authorization'])) {
            if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
                $headers['authorization'] = $_SERVER['HTTP_AUTHORIZATION'];
            } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
                $headers['authorization'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
            }
        }

        return $headers;
    }

    public function method(): string
    {
        return $this->method;
    }

    public function query(string $key, mixed $default = null): mixed
    {
        return $this->query[$key] ?? $default;
    }

    public function param(string $key, mixed $default = null): mixed
    {
        return $this->params[$key] ?? $default;
    }

    public function data(string $key = '', mixed $default = null): mixed
    {
        if ($key === '') {
            return $this->data;
        }
        return $this->data[$key] ?? $default;
    }

    public function all(): array
    {
        return $this->data;
    }

    public function header(string $key, mixed $default = null): mixed
    {
        $lowerKey = strtolower($key);
        return $this->headers[$lowerKey] ?? $default;
    }

    public function hasHeader(string $key): bool
    {
        return $this->header($key) !== null;
    }

    public function path(): string
    {
        return parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
    }

    public function isGet(): bool
    {
        return $this->method === 'GET';
    }

    public function isPost(): bool
    {
        return $this->method === 'POST';
    }

    public function isPut(): bool
    {
        return $this->method === 'PUT';
    }

    public function isDelete(): bool
    {
        return $this->method === 'DELETE';
    }

    public function isJson(): bool
    {
        $contentType = $this->header('content-type', '');
        return stripos($contentType, 'application/json') !== false;
    }

    public function email(): mixed
    {
        $email = $this->data('email');
        if (!is_string($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        return $email;
    }

    public function validateRequired(array $fields): bool
    {
        foreach ($fields as $field) {
            $val = $this->data($field);
            if ($val === null || $val === '') {
                return false;
            }
        }
        return true;
    }

    public function setParam(string $key, mixed $value): void
    {
        $this->params[$key] = $value;
    }
}