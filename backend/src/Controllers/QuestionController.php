<?php
namespace TechStore\Controllers;

use TechStore\Core\Controller;
use TechStore\Core\Request;
use TechStore\Models\Question;
use TechStore\Models\Product;

/**
 * کنترلر پرسش و پاسخ کاربران درباره محصولات
 */
class QuestionController extends Controller
{
    private Question $questionModel;
    private Product $productModel;

    public function __construct()
    {
        $this->questionModel = new Question();
        $this->productModel = new Product();
    }

    /**
     * GET /api/products/:slug/questions - دریافت لیست پرسش‌ها و پاسخ‌های یک محصول
     */
    public function index(Request $request): void
    {
        $slug = $request->param('slug');
        if (!$slug) {
            $this->error('اسلاگ محصول الزامی است', 400);
        }

        $product = $this->productModel->findBySlug($slug);
        if (!$product) {
            $this->error('محصول مورد نظر یافت نشد', 404);
        }

        $limit = (int)($request->query('limit', 50) ?: 50);
        $offset = (int)($request->query('offset', 0) ?: 0);

        $questions = $this->questionModel->getProductQuestions((int)$product['id'], $limit, $offset);

        $this->success([
            'questions' => $questions,
            'total' => count($questions)
        ]);
    }

    /**
     * POST /api/products/:slug/questions - ثبت پرسش جدید برای محصول
     */
    public function store(Request $request): void
    {
        $userId = $_SESSION['user']['user_id'] ?? null;
        if (!$userId) {
            $this->error('برای ثبت سوال باید وارد حساب کاربری خود شوید', 401);
        }

        $slug = $request->param('slug');
        if (!$slug) {
            $this->error('اسلاگ محصول الزامی است', 400);
        }

        $product = $this->productModel->findBySlug($slug);
        if (!$product) {
            $this->error('محصول مورد نظر یافت نشد', 404);
        }

        $questionText = trim((string)$request->data('question'));
        if (empty($questionText)) {
            $this->error('متن پرسش الزامی است', 400);
        }

        try {
            $questionId = $this->questionModel->createQuestion([
                'product_id' => (int)$product['id'],
                'user_id' => (int)$userId,
                'question' => $questionText
            ]);

            $this->success([
                'question_id' => $questionId
            ], 'پرسش شما با موفقیت ثبت شد و پس از بررسی پاسخ داده خواهد شد');
        } catch (\Throwable $e) {
            $this->error('خطا در ثبت سوال: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/questions/:id - مشاهده جزئیات یک سوال
     */
    public function show(Request $request): void
    {
        $questionId = (int)$request->param('id');
        if (!$questionId) {
            $this->error('شناسه پرسش الزامی است', 400);
        }

        $question = $this->questionModel->getQuestionDetails($questionId);
        if (!$question) {
            $this->error('پرسش مورد نظر یافت نشد', 404);
        }

        $this->success($question);
    }

    /**
     * PUT /api/questions/:id - پاسخ به پرسش توسط مدیر
     */
    public function update(Request $request): void
    {
        $questionId = (int)$request->param('id');
        $answer = trim((string)$request->data('answer'));

        if (!$questionId || empty($answer)) {
            $this->error('شناسه سوال و متن پاسخ الزامی هستند', 400);
        }

        $question = $this->questionModel->find($questionId);
        if (!$question) {
            $this->error('پرسش مورد نظر یافت نشد', 404);
        }

        if ($this->questionModel->answer($questionId, $answer)) {
            $this->success(null, 'پاسخ با موفقیت ثبت شد');
        } else {
            $this->error('خطا در ثبت پاسخ', 500);
        }
    }

    /**
     * DELETE /api/questions/:id - حذف سوال توسط مدیر
     */
    public function delete(Request $request): void
    {
        $questionId = (int)$request->param('id');
        if (!$questionId) {
            $this->error('شناسه سوال الزامی است', 400);
        }

        if ($this->questionModel->delete($questionId)) {
            $this->success(null, 'پرسش با موفقیت حذف شد');
        } else {
            $this->error('خطا در حذف پرسش', 500);
        }
    }
}