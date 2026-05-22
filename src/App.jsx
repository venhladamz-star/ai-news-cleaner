import React, { useState, useEffect } from 'react';
import { Newspaper, ShieldCheck, HelpCircle, BookOpen } from 'lucide-react';
import ReaderDashboard from './components/ReaderDashboard.jsx';
import ReaderView from './components/ReaderView.jsx';
import AdminPanel from './components/AdminPanel.jsx';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard', 'reader', 'admin'
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loadingArticles, setLoadingArticles] = useState(false);

  // Tải danh sách bài báo khi khởi động ứng dụng
  useEffect(() => {
    fetchArticles();
  }, []);

  // Lấy dữ liệu bài báo từ Backend Express API
  const fetchArticles = async () => {
    setLoadingArticles(true);
    try {
      const response = await fetch('/api/articles');
      const result = await response.json();
      if (result.success) {
        setArticles(result.articles);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách bài báo:', error);
    } finally {
      setLoadingArticles(false);
    }
  };

  // Chọn đọc chi tiết một bài viết
  const selectArticle = async (id) => {
    try {
      // Đầu tiên, thử tìm trong danh sách state cục bộ để hiển thị ngay lập tức (mượt mà)
      const localFound = articles.find(art => art.id === id);
      if (localFound) {
        setSelectedArticle(localFound);
        setActivePage('reader');
      }

      // Vẫn gọi API để lấy dữ liệu mới nhất (nếu cần)
      const response = await fetch(`/api/articles/${id}`);
      const result = await response.json();
      if (result.success) {
        setSelectedArticle(result.article);
        setActivePage('reader');
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết bài viết:', error);
    }
  };

  // Quay lại màn hình trang chủ
  const handleBackToDashboard = () => {
    setActivePage('dashboard');
    setSelectedArticle(null);
  };

  return (
    <div className="app-container">
      
      {/* 🧭 THANH ĐIỀU HƯỚNG GLASSMORPHISM CAO CẤP */}
      <nav className="navbar">
        <div className="nav-brand" onClick={handleBackToDashboard} style={{ cursor: 'pointer' }}>
          <Newspaper size={24} className="text-violet-400" />
          <span>AI Curated News</span>
        </div>

        <div className="nav-links">
          <button
            className={`nav-btn ${activePage === 'dashboard' || activePage === 'reader' ? 'active' : ''}`}
            onClick={handleBackToDashboard}
          >
            <BookOpen size={16} />
            <span>Đọc báo</span>
          </button>
          <button
            className={`nav-btn ${activePage === 'admin' ? 'active' : ''}`}
            onClick={() => setActivePage('admin')}
          >
            <ShieldCheck size={16} />
            <span>Cổng tuyển chọn (Admin)</span>
          </button>
        </div>
      </nav>

      {/* 📰 TIÊU ĐỀ PHỤ TRANG CHỦ (Chỉ hiện khi ở Dashboard độc giả) */}
      {activePage === 'dashboard' && (
        <header className="header-section">
          <h1 className="main-title">Tin tức Tuyển chọn bởi AI</h1>
          <p className="subtitle">
            Khám phá kho kiến thức tinh khiết mỗi ngày. Chúng tôi loại bỏ hoàn toàn quảng cáo rác, tóm tắt ý chính và hỗ trợ học tiếng Anh hiệu quả qua các bài báo quốc tế.
          </p>
        </header>
      )}

      {/* 🔀 ĐỊNH TUYẾN CÁC TRANG CHÍNH */}
      <main className="mt-8">
        {activePage === 'dashboard' && (
          <ReaderDashboard
            articles={articles}
            onSelectArticle={selectArticle}
            loading={loadingArticles}
          />
        )}

        {activePage === 'reader' && (
          <ReaderView
            article={selectedArticle}
            onBack={handleBackToDashboard}
          />
        )}

        {activePage === 'admin' && (
          <AdminPanel
            onArticlePublished={fetchArticles}
          />
        )}
      </main>

      {/* 📌 FOOTER */}
      <footer className="mt-20 text-center text-xs text-slate-600 border-t border-slate-900 pt-6">
        <p>© 2026 AI News Curated. Vận hành bởi Gemini 3.5 Flash & Cheerio Scraper.</p>
      </footer>

    </div>
  );
}
