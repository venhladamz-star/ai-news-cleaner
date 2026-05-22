# AI News Cleaner (Full-Stack React + Node.js + Express)

Ứng dụng web cao cấp giúp làm sạch bài báo (loại bỏ hoàn toàn quảng cáo rác, sidebar, footer) và sử dụng AI để tóm tắt tự động, trích xuất từ vựng hỗ trợ người học tiếng Anh.

## Các tính năng nổi bật:
- **Làm sạch nội dung**: Sử dụng `node-fetch` kết hợp với `cheerio` để cào nội dung, lọc sạch các thẻ quảng cáo, sidebars, scripts rác và chỉ giữ lại tiêu đề kèm các tag bài viết chính (`p`, `h1`-`h3`).
- **Giao diện Kindle Reader Mode**: Bản làm sạch hiển thị trực quan ở cột trái giúp tập trung tối đa vào việc đọc nội dung bài viết.
- **Tích hợp LLM đa dạng**: Hỗ trợ gọi API trực tiếp tới Gemini (OpenAI/Gemini) để phân tích bài báo trả về JSON.
- **Mock Mode dự phòng thông minh**: Nếu bạn không điền API Key trong file `.env`, backend sẽ tự động chạy chế độ Mockup tạo dữ liệu sinh động dựa trên chính tiêu đề bài báo của bạn giúp trải nghiệm giao diện trơn tru ngay lập tức!
- **Học tiếng Anh thông minh**: Chế độ từ vựng bóc tách cụm từ, giải nghĩa và đưa ra câu ví dụ mẫu bôi đậm cực kỳ trực quan.
- **Thiết kế Glassmorphism đẳng cấp**: Nền Dark Mode huyền ảo với các khối kính mờ, gradient lung linh cùng micro-animations mượt mà.

---

## Cấu trúc thư mục dự án:
```text
ai-news-cleaner/
├── backend/
│   ├── services/
│   │   └── newsCleaner.js     # Đọc, làm sạch bài báo và gọi LLM API
│   ├── .env                   # Lưu khóa API và cấu hình cổng
│   ├── package.json           # express, cors, cheerio, node-fetch, @google/generative-ai
│   └── server.js              # Express backend server
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── InputForm.jsx       # Thanh công cụ nhập link & chọn chế độ
    │   │   └── SummaryDisplay.jsx  # Hiển thị Clean Reader & Tóm tắt AI
    │   ├── App.jsx            # Component chính, quản lý state và call API
    │   ├── index.css          # Hệ thống CSS Glassmorphism
    │   └── main.jsx
    ├── index.html
    ├── package.json           # React, Vite, Lucide-react
    └── vite.config.js
```

---

## Hướng dẫn cài đặt và sử dụng:

### Bước 1: Mở dự án bằng IDE của bạn
Vui lòng thiết lập active workspace hoặc mở thư mục dự án này bằng IDE của bạn:
📁 **`C:\Users\khue\Desktop\ai-news-cleaner`**

---

### Bước 2: Cài đặt và khởi chạy Backend (Express Server)
Mở cửa sổ dòng lệnh và di chuyển vào thư mục `backend`, cài đặt thư viện và chạy:
```bash
cd backend
npm install
npm start
```
*Server sẽ khởi động tại: http://localhost:5000*

> **Lưu ý về API Key:**
> Để sử dụng AI thật, bạn hãy mở file `backend/.env` bằng trình chỉnh sửa và điền khóa API của bạn vào:
> `GEMINI_API_KEY=khóa_api_gemini_của_bạn` hoặc `OPENAI_API_KEY=khóa_api_openai_của_bạn`.
> Nếu không có key, ứng dụng vẫn sẽ chạy ở **MOCK MODE** mô phỏng tóm tắt thực tế vô cùng mượt mà để bạn test giao diện!

---

### Bước 3: Cài đặt và khởi chạy Frontend (React + Vite App)
Mở một cửa sổ dòng lệnh thứ hai, di chuyển vào thư mục `frontend`, cài đặt thư viện và chạy:
```bash
cd frontend
npm install
npm run dev
```
*Ứng dụng giao diện sẽ mở tại: http://localhost:3000*

---

## Trải nghiệm sử dụng:
1. Mở trình duyệt tại địa chỉ http://localhost:3000.
2. Dán một link bài viết trực tuyến (ví dụ: BBC News, VnExpress...).
3. Chọn chế độ: **Dành cho người học Tiếng Anh** để khám phá giao diện 2 tab dịch song ngữ và thẻ từ vựng 3D tuyệt đẹp.
4. Nhấn **Rút gọn bài báo** và thưởng thức trải nghiệm đọc tin tức thế hệ mới!
