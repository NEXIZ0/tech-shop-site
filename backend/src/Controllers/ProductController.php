<?php
namespace TechStore\Controllers;

use TechStore\Core\Controller;
use TechStore\Core\Request;
use TechStore\Models\Product;
use TechStore\Config\Database;

/**
 * کنترلر محصولات (لیست، جزئیات، ویژه، جستجو و عملیات مدیریت)
 */
class ProductController extends Controller
{
    private Product $productModel;

    public function __construct()
    {
        $this->productModel = new Product();
    }

    /**
     * GET /api/products - لیست محصولات با فیلترها و صفحه‌بندی
     */
    public function index(Request $request): void
    {
        $categoryId = $request->query('category');
        $search = $request->query('search');
        $sort = $request->query('sort');
        $order = $request->query('order', 'DESC');
        $limit = (int)($request->query('limit', 20) ?: 20);
        $offset = (int)($request->query('offset', 0) ?: 0);

        $minPrice = $request->query('min_price') ? (float)$request->query('min_price') : null;
        $maxPrice = $request->query('max_price') ? (float)$request->query('max_price') : null;

        $products = $this->productModel->getAllWithCategory(
            $categoryId ? (int)$categoryId : null,
            $search,
            $sort,
            $order,
            ['min' => $minPrice, 'max' => $maxPrice],
            $limit,
            $offset
        );

        $count = $this->productModel->getCount(
            $categoryId ? (int)$categoryId : null,
            $search
        );

        $this->success([
            'products' => $products,
            'total' => $count,
            'limit' => $limit,
            'offset' => $offset
        ]);
    }

    /**
     * GET /api/products/featured - دریافت لیست محصولات ویژه
     */
    public function featured(Request $request): void
    {
        $limit = (int)($request->query('limit', 8) ?: 8);
        $products = $this->productModel->getFeatured($limit);
        $this->success([
            'products' => $products,
            'total' => count($products)
        ]);
    }

    /**
     * GET /api/products/new - دریافت جدیدترین محصولات
     */
    public function new(Request $request): void
    {
        $limit = (int)($request->query('limit', 8) ?: 8);
        $products = $this->productModel->getNew($limit);
        $this->success([
            'products' => $products,
            'total' => count($products)
        ]);
    }

    /**
     * GET /api/products/search - جستجوی محصولات
     */
    public function search(Request $request): void
    {
        $query = trim((string)$request->query('q', $request->query('search', '')));
        $limit = (int)($request->query('limit', 20) ?: 20);

        if (empty($query)) {
            $this->error('عبارت جستجو الزامی است', 400);
        }

        $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE p.name LIKE ? OR p.description LIKE ? 
                ORDER BY p.is_featured DESC, p.created_at DESC 
                LIMIT " . (int)$limit;
        
        $stmt = Database::getConnection()->prepare($sql);
        $searchTerm = "%{$query}%";
        $stmt->execute([$searchTerm, $searchTerm]);
        $products = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $this->success([
            'products' => $products,
            'total' => count($products)
        ]);
    }

    /**
     * GET /api/products/:slug - مشاهده جزئیات محصول با گالری و مشخصات
     */
    public function show(Request $request): void
    {
        $slug = $request->param('slug');
        if (!$slug) {
            $this->error('شناسه اسلاگ محصول الزامی است', 400);
        }

        $product = $this->productModel->findBySlug($slug);
        if (!$product) {
            $this->error('محصول مورد نظر یافت نشد', 404);
        }

        $productId = (int)$product['id'];

        // تصاویر گالری محصول
        $sqlImages = "SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id ASC";
        $images = $this->productModel->query($sqlImages, [$productId]);
        $product['images'] = $images ?: [];

        // اگر لیست عکس‌ها خالی بود از عکس اصلی استفاده می‌کنیم
        if (empty($product['images']) && !empty($product['image_url'])) {
            $product['images'] = [
                ['id' => 1, 'product_id' => $productId, 'image_url' => $product['image_url'], 'is_primary' => 1]
            ];
        }

        // مشخصات فنی محصول
        $sqlSpecs = "SELECT spec_key, spec_value FROM product_specs WHERE product_id = ? ORDER BY id ASC";
        $specsRaw = $this->productModel->query($sqlSpecs, [$productId]);
        
        $specsMap = [];
        foreach ($specsRaw as $row) {
            $specsMap[$row['spec_key']] = $row['spec_value'];
        }
        $product['specs'] = $specsMap;
        $product['specs_list'] = $specsRaw;

        // محصولات مرتبط
        $product['related'] = $this->productModel->getRelated($productId, 4);

        $this->success($product);
    }

    /**
     * POST /api/products - ایجاد محصول جدید توسط مدیر
     */
    public function store(Request $request): void
    {
        if (!$this->validateRequired($request->all(), ['name', 'category_id', 'price', 'description'])) {
            $this->error('نام، دسته‌بندی، قیمت و توضیحات الزامی هستند', 400);
        }

        try {
            $name = trim($request->data('name'));
            $slug = $this->slugify($name);
            
            // جلوگیری از تکراری شدن اسلاگ
            $existing = $this->productModel->findBySlug($slug);
            if ($existing) {
                $slug .= '-' . time();
            }

            $productId = $this->productModel->create([
                'category_id' => (int)$request->data('category_id'),
                'name' => $name,
                'slug' => $slug,
                'description' => trim($request->data('description')),
                'price' => (float)$request->data('price'),
                'stock' => (int)($request->data('stock') ?? 0),
                'image_url' => $request->data('image_url') ?: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
                'is_featured' => (int)($request->data('is_featured') ?? 0),
                'is_new' => (int)($request->data('is_new') ?? 0)
            ]);

            // اگر تصویر ارسال شده بود در جدول product_images هم ثبت شود
            if ($request->data('image_url')) {
                $sqlImg = "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)";
                Database::getConnection()->prepare($sqlImg)->execute([$productId, $request->data('image_url')]);
            }

            $createdProduct = $this->productModel->find($productId);
            $this->success($createdProduct, 'محصول با موفقیت ایجاد شد');
        } catch (\Throwable $e) {
            $this->error('خطا در ایجاد محصول: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/products/:id - ویرایش محصول توسط مدیر
     */
    public function update(Request $request): void
    {
        $id = (int)$request->param('id');
        if (!$id) {
            $this->error('شناسه محصول الزامی است', 400);
        }

        $product = $this->productModel->find($id);
        if (!$product) {
            $this->error('محصول مورد نظر یافت نشد', 404);
        }

        $updateData = [];
        if ($request->data('name') !== null) $updateData['name'] = trim($request->data('name'));
        if ($request->data('category_id') !== null) $updateData['category_id'] = (int)$request->data('category_id');
        if ($request->data('description') !== null) $updateData['description'] = trim($request->data('description'));
        if ($request->data('price') !== null) $updateData['price'] = (float)$request->data('price');
        if ($request->data('stock') !== null) $updateData['stock'] = (int)$request->data('stock');
        if ($request->data('image_url') !== null) $updateData['image_url'] = trim($request->data('image_url'));
        if ($request->data('is_featured') !== null) $updateData['is_featured'] = (int)$request->data('is_featured');
        if ($request->data('is_new') !== null) $updateData['is_new'] = (int)$request->data('is_new');

        if (!empty($updateData)) {
            $this->productModel->update($id, $updateData);
        }

        $updated = $this->productModel->find($id);
        $this->success($updated, 'محصول با موفقیت به‌روزرسانی شد');
    }

    /**
     * DELETE /api/products/:id - حذف محصول توسط مدیر
     */
    public function delete(Request $request): void
    {
        $id = (int)$request->param('id');
        if (!$id) {
            $this->error('شناسه محصول الزامی است', 400);
        }

        $product = $this->productModel->find($id);
        if (!$product) {
            $this->error('محصول مورد نظر یافت نشد', 404);
        }

        $this->productModel->delete($id);
        $this->success([], 'محصول با موفقیت حذف شد');
    }
}