<?php
namespace TechStore\Controllers;

use TechStore\Core\Controller;
use TechStore\Core\Request;
use TechStore\Models\Cart;
use TechStore\Models\Product;

/**
 * کنترلر مدیریت سبد خرید
 */
class CartController extends Controller
{
    private Cart $cartModel;
    private Product $productModel;

    public function __construct()
    {
        $this->cartModel = new Cart();
        $this->productModel = new Product();
    }

    /**
     * استخراج نشست جاری کاربر لاگین شده یا مهمان
     */
    private function getCartContext(): array
    {
        $userId = isset($_SESSION['user']['user_id']) ? (int)$_SESSION['user']['user_id'] : null;
        $sessionId = session_id() ?: ($_COOKIE['PHPSESSID'] ?? 'sess_default');
        return [$userId, $sessionId];
    }

    /**
     * GET /api/cart - دریافت اقلام سبد خرید و جمع مبالغ
     */
    public function index(Request $request): void
    {
        [$userId, $sessionId] = $this->getCartContext();
        
        $cart = $this->cartModel->getActiveCart($userId, $sessionId);
        if (!$cart) {
            $this->error('سبد خرید یافت نشد', 404);
        }

        $cartId = (int)$cart['id'];
        $items = $this->cartModel->getItems($cartId);
        $total = $this->cartModel->getCartTotal($cartId);

        $this->success([
            'cart' => $cart,
            'items' => $items,
            'total' => $total,
            'tax' => round($total * 0.08, 2), // ۸ درصد مالیات
            'grand_total' => round($total * 1.08, 2)
        ]);
    }

    /**
     * POST /api/cart/items - افزودن کالا به سبد خرید
     */
    public function addItem(Request $request): void
    {
        [$userId, $sessionId] = $this->getCartContext();

        $productId = (int)($request->data('product_id') ?: $request->data('productId'));
        $quantity = (int)($request->data('quantity') ?: 1);

        if (!$productId || $quantity < 1) {
            $this->error('شناسه محصول و تعداد معتبر الزامی هستند', 400);
        }

        // بررسی موجودی محصول در انبار
        $product = $this->productModel->find($productId);
        if (!$product) {
            $this->error('محصول یافت نشد', 404);
        }

        if ((int)$product['stock'] < $quantity) {
            $this->error('موجودی محصول در انبار کافی نیست', 400);
        }

        $cart = $this->cartModel->getActiveCart($userId, $sessionId);
        $cartId = (int)$cart['id'];

        if (!$this->cartModel->addItem($cartId, $productId, $quantity)) {
            $this->error('خطا در افزودن به سبد خرید', 500);
        }

        $items = $this->cartModel->getItems($cartId);
        $total = $this->cartModel->getCartTotal($cartId);

        $this->success([
            'items' => $items,
            'total' => $total
        ], 'کالا با موفقیت به سبد خرید اضافه شد');
    }

    /**
     * PUT /api/cart/items/:id - به‌روزرسانی تعداد یک کالا در سبد خرید
     */
    public function updateItem(Request $request): void
    {
        [$userId, $sessionId] = $this->getCartContext();

        $itemId = (int)$request->param('id');
        $quantity = (int)$request->data('quantity');

        if (!$itemId) {
            $this->error('شناسه قلم کالا الزامی است', 400);
        }

        $cart = $this->cartModel->getActiveCart($userId, $sessionId);
        $cartId = (int)$cart['id'];

        if ($quantity <= 0) {
            $this->cartModel->removeItem($cartId, $itemId);
        } else {
            $this->cartModel->updateItem($cartId, $itemId, $quantity);
        }

        $items = $this->cartModel->getItems($cartId);
        $total = $this->cartModel->getCartTotal($cartId);

        $this->success([
            'items' => $items,
            'total' => $total
        ], 'تعداد کالا به‌روزرسانی شد');
    }

    /**
     * DELETE /api/cart/items/:id - حذف کالا از سبد خرید
     */
    public function removeItem(Request $request): void
    {
        [$userId, $sessionId] = $this->getCartContext();

        $itemId = (int)$request->param('id');
        if (!$itemId) {
            $this->error('شناسه کالا الزامی است', 400);
        }

        $cart = $this->cartModel->getActiveCart($userId, $sessionId);
        $cartId = (int)$cart['id'];

        $this->cartModel->removeItem($cartId, $itemId);

        $items = $this->cartModel->getItems($cartId);
        $total = $this->cartModel->getCartTotal($cartId);

        $this->success([
            'items' => $items,
            'total' => $total
        ], 'کالا با موفقیت از سبد خرید حذف شد');
    }

    /**
     * DELETE /api/cart - خالی کردن کل سبد خرید
     */
    public function clear(Request $request): void
    {
        [$userId, $sessionId] = $this->getCartContext();

        $cart = $this->cartModel->getActiveCart($userId, $sessionId);
        if ($cart) {
            $this->cartModel->clearCart((int)$cart['id']);
        }

        $this->success([
            'items' => [],
            'total' => 0
        ], 'سبد خرید خالی شد');
    }
}