import admin from 'firebase-admin';
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

// Trạng thái kết nối cơ sở dữ liệu: 'local', 'mongodb', 'firebase'
let dbMode = 'local';

// Khởi tạo các biến kết nối
let firestoreDb = null;
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
 * Khởi tạo kết nối tới Database (Ưu tiên Firebase Firestore -> MongoDB Atlas -> Local JSON)
 */
async function initDb() {
  // 1. Thử kết nối Firebase Firestore nếu có cấu hình
  const firebaseAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const firebaseAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (
    (firebaseAccount && firebaseAccount.trim() !== '') ||
    (firebaseAccountPath && firebaseAccountPath.trim() !== '')
  ) {
    try {
      if (!admin.apps.length) {
        console.log('🔌 Đang kết nối tới Firebase Firestore...');
        let credential;

        if (firebaseAccount && firebaseAccount.trim() !== '') {
          // Làm sạch chuỗi trước khi parse
          let rawConfig = firebaseAccount.trim();

          // 1. Khử bỏ cặp dấu ngoặc kép hoặc ngoặc đơn bọc ngoài cùng (lỗi kinh điển khi nhập biến môi trường)
          if (
            (rawConfig.startsWith('"') && rawConfig.endsWith('"')) ||
            (rawConfig.startsWith("'") && rawConfig.endsWith("'"))
          ) {
            const candidate = rawConfig.slice(1, -1).trim();
            if (candidate.startsWith('{') || candidate.includes('"type":')) {
              rawConfig = candidate;
            }
          }

          // 2. Khắc phục lỗi copy thiếu dấu ngoặc nhọn mở `{` hoặc đóng `}` (nguyên nhân gây lỗi Unexpected non-whitespace character after JSON)
          if (!rawConfig.startsWith('{') && rawConfig.includes('"type":')) {
            console.log('⚠️ Phát hiện thiếu ngoặc nhọn mở `{`, đang tự động bổ sung...');
            rawConfig = '{' + rawConfig;
          }
          if (!rawConfig.endsWith('}') && rawConfig.startsWith('{')) {
            console.log('⚠️ Phát hiện thiếu ngoặc nhọn đóng `}`, đang tự động bổ sung...');
            rawConfig = rawConfig + '}';
          }

          let parsedCredentials;
          try {
            parsedCredentials = JSON.parse(rawConfig);
            // Nếu bị bọc ngoặc kép 2 lần (thành string), parse tiếp lần nữa để ra object
            if (typeof parsedCredentials === 'string') {
              parsedCredentials = JSON.parse(parsedCredentials);
            }
          } catch (jsonErr) {
            // Thử dọn dẹp các ký tự escape lỗi
            const cleaned = rawConfig.replace(/\\n/g, '\n').trim();
            parsedCredentials = JSON.parse(cleaned);
            if (typeof parsedCredentials === 'string') {
              parsedCredentials = JSON.parse(parsedCredentials);
            }
          }

          // SỬA LỖI KINH ĐIỂN TRÊN VERCEL: Đảm bảo private_key có ký tự xuống dòng thực tế
          if (parsedCredentials && parsedCredentials.private_key) {
            parsedCredentials.private_key = parsedCredentials.private_key.replace(/\\n/g, '\n');
          }

          credential = admin.credential.cert(parsedCredentials);
        } else if (firebaseAccountPath && firebaseAccountPath.trim() !== '') {
          // Load từ đường dẫn file cục bộ (Lý tưởng khi chạy test trên máy tính cá nhân)
          const resolvedPath = path.resolve(process.cwd(), firebaseAccountPath);
          if (fs.existsSync(resolvedPath)) {
            const rawKey = fs.readFileSync(resolvedPath, 'utf8');
            const parsedLocal = JSON.parse(rawKey);
            
            if (parsedLocal && parsedLocal.private_key) {
              parsedLocal.private_key = parsedLocal.private_key.replace(/\\n/g, '\n');
            }
            credential = admin.credential.cert(parsedLocal);
          } else {
            throw new Error(`Không tìm thấy file Firebase key tại: ${resolvedPath}`);
          }
        }

        admin.initializeApp({
          credential: credential
        });
        console.log('✅ Đã khởi tạo Firebase Admin SDK thành công!');
      }

      // LUÔN LUÔN gán lại firestoreDb để tránh bị null trong môi trường Vercel Serverless
      firestoreDb = admin.firestore();
      dbMode = 'firebase';
      return true;
    } catch (error) {
      console.error('❌ Lỗi kết nối Firebase Firestore, thử chuyển sang phương án khác:', error);
    }
  }

  // 2. Thử kết nối tới MongoDB nếu có cấu hình trong env
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
      dbMode = 'mongodb';
      return true;
    } catch (error) {
      console.error('❌ Lỗi kết nối MongoDB Atlas, chuyển về Local Database:', error.message);
    }
  }

  // 3. Fallback về chế độ lưu trữ cục bộ
  dbMode = 'local';
  return false;
}

/**
 * Ghi dữ liệu vào file local (Chỉ hoạt động khi chạy máy tính cục bộ)
 */
function saveLocalFile() {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(memoryArticles, null, 2), 'utf8');
  } catch (err) {
    console.log('⚠️ Lưu file cục bộ thất bại (môi trường Serverless Vercel):', err.message);
  }
}

/**
 * Lấy danh sách toàn bộ bài viết
 * @returns {Promise<Array>}
 */
export async function getArticles() {
  await initDb();

  // CHẾ ĐỘ 1: FIREBASE FIRESTORE
  if (dbMode === 'firebase' && firestoreDb) {
    try {
      const snapshot = await firestoreDb.collection('articles')
        .orderBy('createdAt', 'desc')
        .get();

      const articles = [];
      snapshot.forEach(doc => {
        articles.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return articles;
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu từ Firebase, dùng tạm Local RAM:', err);
    }
  }

  // CHẾ ĐỘ 2: MONGODB ATLAS
  if (dbMode === 'mongodb' && articlesCollection) {
    try {
      const articles = await articlesCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      return articles.map(art => ({
        ...art,
        id: art._id.toString()
      }));
    } catch (err) {
      console.error('Lỗi khi lấy bài viết từ MongoDB, dùng tạm Local RAM:', err);
    }
  }

  // CHẾ ĐỘ CỤC BỘ: LOCAL FILE (RAM)
  return [...memoryArticles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Lấy chi tiết một bài viết theo ID
 * @param {string} id - Mã ID của bài báo
 * @returns {Promise<object|null>}
 */
export async function getArticleById(id) {
  await initDb();

  // CHẾ ĐỘ 1: FIREBASE FIRESTORE
  if (dbMode === 'firebase' && firestoreDb) {
    try {
      const doc = await firestoreDb.collection('articles').doc(id).get();
      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data()
        };
      }
    } catch (err) {
      console.error('Lỗi khi lấy chi tiết bài viết từ Firebase:', err);
    }
  }

  // CHẾ ĐỘ 2: MONGODB ATLAS
  if (dbMode === 'mongodb' && articlesCollection) {
    try {
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

  // CHẾ ĐỘ CỤC BỘ: LOCAL RAM
  const article = memoryArticles.find(art => art.id === id);
  return article || null;
}

/**
 * Lưu một bài viết mới
 * @param {object} articleData - Dữ liệu bài báo đã làm sạch & tóm tắt
 * @returns {Promise<object>} - Bài viết đã được lưu kèm ID
 */
export async function saveArticle(articleData) {
  await initDb();

  const now = new Date();
  const dateString = now.toISOString().split('T')[0]; // Định dạng YYYY-MM-DD

  const article = {
    ...articleData,
    createdAt: now.toISOString(),
    dateString: dateString
  };

  // CHẾ ĐỘ 1: FIREBASE FIRESTORE
  if (dbMode === 'firebase' && firestoreDb) {
    try {
      const docRef = await firestoreDb.collection('articles').add(article);
      console.log('📝 Đã lưu bài viết mới thành công lên Firebase Firestore!');
      return {
        ...article,
        id: docRef.id
      };
    } catch (err) {
      console.error('Lỗi lưu Firebase, lưu dự phòng xuống Local RAM:', err);
    }
  }

  // CHẾ ĐỘ 2: MONGODB ATLAS
  if (dbMode === 'mongodb' && articlesCollection) {
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

  // CHẾ ĐỘ CỤC BỘ: LOCAL RAM + FILE
  const localArticle = {
    ...article,
    id: Date.now().toString() // Dùng timestamp làm ID local
  };

  memoryArticles.push(localArticle);
  saveLocalFile();
  console.log('📝 Đã lưu bài viết mới thành công xuống Database Local (articles_local.json)!');

  return localArticle;
}

/**
 * Cập nhật thông tin bài viết theo ID
 * @param {string} id - Mã ID của bài báo
 * @param {object} updatedData - Dữ liệu cập nhật mới
 * @returns {Promise<object|null>}
 */
export async function updateArticle(id, updatedData) {
  await initDb();

  // CHẾ ĐỘ 1: FIREBASE FIRESTORE
  if (dbMode === 'firebase' && firestoreDb) {
    try {
      const docRef = firestoreDb.collection('articles').doc(id);
      const doc = await docRef.get();
      if (doc.exists) {
        const { id: _, ...dataToSave } = updatedData;
        await docRef.update(dataToSave);
        console.log(`📝 Đã cập nhật bài viết ${id} thành công trên Firebase Firestore!`);
        return {
          id,
          ...doc.data(),
          ...dataToSave
        };
      }
    } catch (err) {
      console.error('Lỗi cập nhật Firebase, thử cập nhật Local RAM:', err);
    }
  }

  // CHẾ ĐỘ 2: MONGODB ATLAS
  if (dbMode === 'mongodb' && articlesCollection) {
    try {
      let query = { _id: id };
      if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) };
      }
      const { id: _, _id: __, ...dataToSave } = updatedData;
      const result = await articlesCollection.findOneAndUpdate(
        query,
        { $set: dataToSave },
        { returnDocument: 'after' }
      );
      if (result) {
        console.log(`📝 Đã cập nhật bài viết ${id} thành công trên MongoDB Atlas!`);
        const updatedDoc = result.value || result;
        return {
          ...updatedDoc,
          id: id
        };
      }
    } catch (err) {
      console.error('Lỗi cập nhật MongoDB, thử cập nhật Local RAM:', err);
    }
  }

  // CHẾ ĐỘ CỤC BỘ: LOCAL RAM + FILE
  const index = memoryArticles.findIndex(art => art.id === id);
  if (index !== -1) {
    const { id: _, ...dataToSave } = updatedData;
    memoryArticles[index] = {
      ...memoryArticles[index],
      ...dataToSave
    };
    saveLocalFile();
    console.log(`📝 Đã cập nhật bài viết ${id} thành công xuống Local File!`);
    return memoryArticles[index];
  }

  return null;
}

/**
 * Xóa bài viết theo ID
 * @param {string} id - Mã ID của bài báo
 * @returns {Promise<boolean>} - Trạng thái xóa
 */
export async function deleteArticle(id) {
  await initDb();

  // CHẾ ĐỘ 1: FIREBASE FIRESTORE
  if (dbMode === 'firebase' && firestoreDb) {
    try {
      await firestoreDb.collection('articles').doc(id).delete();
      console.log(`🗑️ Đã xóa bài viết ${id} thành công khỏi Firebase Firestore!`);
      return true;
    } catch (err) {
      console.error('Lỗi xóa Firebase, thử xóa Local RAM:', err);
    }
  }

  // CHẾ ĐỘ 2: MONGODB ATLAS
  if (dbMode === 'mongodb' && articlesCollection) {
    try {
      let query = { _id: id };
      if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) };
      }
      const result = await articlesCollection.deleteOne(query);
      if (result.deletedCount > 0) {
        console.log(`🗑️ Đã xóa bài viết ${id} thành công khỏi MongoDB Atlas!`);
        return true;
      }
    } catch (err) {
      console.error('Lỗi xóa MongoDB, thử xóa Local RAM:', err);
    }
  }

  // CHẾ ĐỘ CỤC BỘ: LOCAL RAM + FILE
  const initialLength = memoryArticles.length;
  memoryArticles = memoryArticles.filter(art => art.id !== id);
  if (memoryArticles.length < initialLength) {
    saveLocalFile();
    console.log(`🗑️ Đã xóa bài viết ${id} thành công khỏi Local File!`);
    return true;
  }

  return false;
}
