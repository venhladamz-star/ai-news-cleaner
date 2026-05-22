import React, { useState, useEffect } from 'react';
import { Newspaper, ShieldCheck, BookOpen, Sun, Moon, Laptop, Smartphone } from 'lucide-react';
import ReaderDashboard from './components/ReaderDashboard.jsx';
import ReaderView from './components/ReaderView.jsx';
import AdminPanel from './components/AdminPanel.jsx';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard', 'reader', 'admin'
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [layoutMode, setLayoutMode] = useState(localStorage.getItem('layoutMode') || null);

  // Quản lý lưu trữ và kích hoạt chủ đề sáng/tối
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleLayout = () => {
    const nextLayout = layoutMode === 'desktop' ? 'mobile' : 'desktop';
    setLayoutMode(nextLayout);
    localStorage.setItem('layoutMode', nextLayout);
  };

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

  // 1️⃣ HIỂN THỊ MÀN HÌNH WELCOME KHI CHƯA CHỌN GIAO DIỆN
  if (!layoutMode) {
    return (
      <div className="welcome-container animate-fadeIn">
        <div className="welcome-card glass-panel text-center">
          <div className="welcome-icon-wrapper">
            <Newspaper size={40} className="text-violet-400" />
          </div>
          <h1 className="welcome-title">AI Curated News</h1>
          <p className="welcome-subtitle">
            Chào mừng bạn đến với nền tảng đọc tin tức tinh khiết, sạch bóng quảng cáo. Hãy lựa chọn giao diện tối ưu nhất cho thiết bị của bạn:
          </p>

          <div className="selection-grid">
            <div 
              className="selection-card glass-panel"
              onClick={() => {
                setLayoutMode('desktop');
                localStorage.setItem('layoutMode', 'desktop');
              }}
            >
              <div className="selection-icon-circle desktop">
                <Laptop size={32} />
              </div>
              <h3 className="selection-card-title">Laptop / Máy tính</h3>
              <p className="selection-card-desc">Giao diện rộng rãi, 2 cột đọc báo song song cùng bảng phân tích AI cao cấp.</p>
            </div>

            <div 
              className="selection-card glass-panel"
              onClick={() => {
                setLayoutMode('mobile');
                localStorage.setItem('layoutMode', 'mobile');
              }}
            >
              <div className="selection-icon-circle mobile">
                <Smartphone size={32} />
              </div>
              <h3 className="selection-card-title">Smartphone</h3>
              <p className="selection-card-desc">Giao diện xếp đứng gọn gàng, nút bấm lớn chạm mượt mà, tối ưu màn hình dọc.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2️⃣ HIỂN THỊ TRANG CHÍNH SAU KHI ĐÃ CHỌN GIAO DIỆN
  return (
    <div className={`app-container layout-mode-${layoutMode}`}>
      
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
          
          <button 
            className="layout-toggle-btn" 
            onClick={toggleLayout} 
            title={layoutMode === 'desktop' ? "Chuyển sang giao diện Smartphone" : "Chuyển sang giao diện Laptop"}
          >
            {layoutMode === 'desktop' ? <Laptop size={18} /> : <Smartphone size={18} />}
          </button>

          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme} 
            title={theme === 'dark' ? "Chuyển sang Chủ đề Sáng" : "Chuyển sang Chủ đề Tối"}
          >
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-700" />}
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
        <p>© 2026 AI News Curated.</p>
      </footer>

    </div>
  );
}
