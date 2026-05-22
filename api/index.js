import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { cleanArticle, summarizeWithAI } from './services/newsCleaner.js';
import { getArticles, getArticleById, saveArticle } from './services/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middleware
app.use(cors({
  origin: '*', // Cho phép mọi kết nối trong môi trường dev
  methods: ['GET', 'POST']
}));
app.use(express.json());

// PIN bảo mật mặc định cho Admin tuyển chọn
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

// 1. Endpoint lấy danh sách tất cả bài viết tuyển chọn
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await getArticles();
    return res.json({
      success: true,
      articles
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bài viết:', error);
    return res.status(500).json({
      success: false,
      error: 'Không thể tải danh sách bài viết.'
    });
  }
});

// 2. Endpoint lấy chi tiết một bài viết cụ thể
app.get('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const article = await getArticleById(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bài viết yêu cầu.'
      });
    }
    return res.json({
      success: true,
      article
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết bài viết:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ khi lấy chi tiết bài báo.'
    });
  }
});

// 3. Endpoint phân tích bài báo mới và ĐĂNG bài (Yêu cầu Admin PIN)
app.post('/api/clean-news', async (req, res) => {
  const { url, mode, pin } = req.body;

  // Xác thực mã PIN bảo mật
  if (!pin || pin.toString() !== ADMIN_PIN.toString()) {
    return res.status(401).json({
      success: false,
      error: 'Mã PIN Quản trị viên không chính xác. Bạn không có quyền đăng bài.'
    });
  }

  if (!url || url.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng cung cấp đường dẫn bài báo hợp lệ.'
    });
  }

  try {
    console.log(`\n=================== YÊU CẦU ĐĂNG BÀI MỚI (ADMIN) ===================`);
    console.log(`URL: ${url}`);
    console.log(`Chế độ tóm tắt AI: ${mode}`);

    // Bước 1: Fetch và làm sạch bài viết bằng Cheerio
    const cleaned = await cleanArticle(url);
    
    // Bước 2: Gọi AI tóm tắt
    const aiResult = await summarizeWithAI(cleaned.title, cleaned.cleanedText);

    // Bước 3: Lưu bài viết vào Cơ sở dữ liệu (Local File / MongoDB Atlas)
    const newArticle = await saveArticle({
      url,
      title: cleaned.title,
      cleanedHtml: cleaned.cleanedHtml,
      summary_vi: aiResult.summary_vi,
      summary_en: aiResult.summary_en,
      bullets: aiResult.bullets,
      phrases_english: aiResult.phrases_english
    });

    console.log(`🎉 Đăng bài viết thành công! ID: ${newArticle.id}`);
    console.log(`===================================================================\n`);

    return res.json({
      success: true,
      article: newArticle
    });

  } catch (error) {
    console.error('Lỗi khi xử lý cào và đăng bài:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Có lỗi xảy ra khi xử lý bài viết.'
    });
  }
});

// Endpoint kiểm tra sức khỏe
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    deployed: 'Vercel Serverless Express',
    dbMode: process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local File / Memory'
  });
});

// Khởi chạy server nếu chạy cục bộ bằng Node (không chạy Serverless)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Express server đang chạy local tại: http://localhost:${PORT}`);
  });
}

// Export cho Vercel Serverless
export default app;
