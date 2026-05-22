import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đường dẫn file lưu trữ dữ liệu local phục vụ cho chế độ phát triển
const LOCAL_DB_PATH = path.join(__dirname, '..', 'articles_local.json');

// Biến lưu trữ RAM tạm thời
let memoryArticles = [];

// Khởi tạo biến MongoDB
let client = null;
let db = null;
let articlesCollection = null;

// Thử tải dữ liệu local lúc khởi động nếu file có sẵn
try {
  if (fs.existsSync(LOCAL_DB_PATH)) {
    const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
    memoryArticles = JSON.parse(raw);
    console.log(`💾 Đã tải thành công ${memoryArticles.length} bài viết từ database local.`);
  }
} catch (err) {
  console.log('⚠️ Không thể đọc file local DB, sử dụng in-memory.');
}

/**
 * Kết nối tới MongoDB nếu có cấu hình trong env
 */
async function initDb() {
  const mongoUri = process.env.MONGODB_URI;
  
  if (mongoUri && mongoUri.trim() !== '' && mongoUri !== 'your_mongodb_uri_here') {
    try {
      if (!client) {
        console.log('🔌 Đang kết nối tới MongoDB Atlas...');
        client = new MongoClient(mongoUri);
        await client.connect();
        db = client.db('ai_news_cleaner');
        articlesCollection = db.collection('articles');
        console.log('✅ Đã kết nối thành công tới MongoDB Atlas!');
      }
      return true;
    } catch (error) {
      console.error('❌ Lỗi kết nối MongoDB Atlas, tự động chuyển về Local Database:', error.message);
      return false;
    }
  }
  return false;
}

/**
 * Ghi đè dữ liệu vào file local (chỉ hoạt động khi chạy local máy tính)
 */
function saveLocalFile() {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(memoryArticles, null, 2), 'utf8');
  } catch (err) {
    // Có thể lỗi do hệ thống file read-only khi deploy Vercel mà chưa cài MongoDB
    console.log('⚠️ Lưu file cục bộ thất bại (đặc trưng môi trường Serverless Vercel):', err.message);
  }
}

/**
 * Lấy danh sách toàn bộ bài viết
 * @returns {Promise<Array>}
 */
export async function getArticles() {
  const isMongo = await initDb();
  
  if (isMongo && articlesCollection) {
    try {
      const articles = await articlesCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      
      // Chuyển đổi _id của mongo thành id chuẩn cho frontend
      return articles.map(art => ({
        ...art,
        id: art._id.toString()
      }));
    } catch (err) {
      console.error('Lỗi khi lấy bài viết từ MongoDB, dùng tạm Local RAM:', err);
    }
  }
  
  // Trả về local RAM và sắp xếp giảm dần theo thời gian tạo
  return [...memoryArticles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Lấy chi tiết một bài viết theo ID
 * @param {string} id - Mã ID của bài báo
 * @returns {Promise<object|null>}
 */
export async function getArticleById(id) {
  const isMongo = await initDb();
  
  if (isMongo && articlesCollection) {
    try {
      // Tìm bằng ObjectId nếu là dạng hex hợp lệ, ngược lại dùng string
      let query = { _id: id };
      if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) };
      }
      const article = await articlesCollection.findOne(query);
      if (article) {
        return {
          ...article,
          id: article._id.toString()
        };
      }
    } catch (err) {
      console.error('Lỗi khi lấy chi tiết bài viết từ MongoDB:', err);
    }
  }
  
  // Tìm trong memory
  const article = memoryArticles.find(art => art.id === id);
  return article || null;
}

/**
 * Lưu một bài viết mới
 * @param {object} articleData - Dữ liệu bài báo đã làm sạch & tóm tắt
 * @returns {Promise<object>} - Bài viết đã được lưu kèm ID
 */
export async function saveArticle(articleData) {
  const isMongo = await initDb();
  
  const now = new Date();
  const dateString = now.toISOString().split('T')[0]; // Định dạng YYYY-MM-DD
  
  const article = {
    ...articleData,
    createdAt: now.toISOString(),
    dateString: dateString
  };

  if (isMongo && articlesCollection) {
    try {
      const result = await articlesCollection.insertOne(article);
      console.log('📝 Đã lưu bài viết mới thành công lên MongoDB Atlas!');
      return {
        ...article,
        id: result.insertedId.toString()
      };
    } catch (err) {
      console.error('Lỗi lưu MongoDB, lưu dự phòng xuống Local RAM:', err);
    }
  }
  
  // Lưu cục bộ (in-memory + local file)
  const localArticle = {
    ...article,
    id: Date.now().toString() // Dùng timestamp làm ID local
  };
  
  memoryArticles.push(localArticle);
  saveLocalFile();
  console.log('📝 Đã lưu bài viết mới thành công xuống Database Local (articles_local.json)!');
  
  return localArticle;
}
