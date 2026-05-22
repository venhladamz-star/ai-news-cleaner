import React, { useState } from 'react';
import { Search, Calendar, GraduationCap, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';

/**
 * Component ReaderDashboard: Trang chủ hiển thị danh sách bài báo tuyển chọn cho Độc giả
 * @param {object} props
 * @param {Array} props.articles - Danh sách bài viết nhận từ Backend
 * @param {function} props.onSelectArticle - Hàm xử lý khi độc giả click vào 1 bài báo để đọc
 * @param {boolean} props.loading - Trạng thái đang tải danh sách bài viết
 */
export default function ReaderDashboard({ articles, onSelectArticle, loading }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Lọc bài viết theo ô tìm kiếm
  const filteredArticles = articles.filter(art => {
    const titleMatch = art.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const domainMatch = art.url?.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || domainMatch;
  });

  // Trích xuất domain chính từ URL (ví dụ: vnexpress.net)
  const getDomainName = (urlString) => {
    try {
      const parsed = new URL(urlString);
      return parsed.hostname.replace('www.', '');
    } catch (e) {
      return 'Tin tức';
    }
  };

  // Gom nhóm bài báo theo Ngày Tháng Năm
  const groupArticlesByDate = (items) => {
    const groups = {};
    const todayStr = new Date().toISOString().split('T')[0];
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    items.forEach(art => {
      // Dùng dateString từ backend, hoặc tự bóc từ createdAt
      const dateKey = art.dateString || art.createdAt?.split('T')[0] || todayStr;
      
      let label = '';
      if (dateKey === todayStr) {
        label = 'Hôm nay';
      } else if (dateKey === yesterdayStr) {
        label = 'Hôm qua';
      } else {
        const parts = dateKey.split('-');
        label = parts.length === 3 ? `Ngày ${parts[2]}/${parts[1]}/${parts[0]}` : dateKey;
      }

      if (!groups[dateKey]) {
        groups[dateKey] = { label, articles: [] };
      }
      groups[dateKey].articles.push(art);
    });

    // Sắp xếp các ngày từ mới nhất đến cũ nhất
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(key => groups[key]);
  };

  const groupedData = groupArticlesByDate(filteredArticles);

  return (
    <div className="animate-fadeIn">
      {/* THANH ĐIỀU KHIỂN & TÌM KIẾM */}
      <div className="dashboard-controls">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm bài báo hoặc trang tin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500 font-medium">
          Hiển thị {filteredArticles.length} bài viết đã tuyển chọn
        </div>
      </div>

      {/* HIỂN THỊ LOADING */}
      {loading && (
        <div className="text-center py-12">
          <svg className="spinner mx-auto mb-4 text-violet-500" viewBox="0 0 24 24" fill="none" style={{ width: '2.5rem', height: '2.5rem' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.2 }} />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400">Đang tải danh sách bài báo tuyển chọn...</p>
        </div>
      )}

      {/* HIỂN THỊ DANH SÁCH BÀI BÁO THEO KHUNG THỜI GIAN */}
      {!loading && groupedData.length > 0 ? (
        groupedData.map((group, groupIndex) => (
          <div key={groupIndex} className="date-group">
            <h3 className="date-group-header">
              <Calendar size={18} className="text-violet-400" />
              <span>{group.label}</span>
              <span className="date-badge">{group.articles.length} bài viết</span>
            </h3>

            <div className="articles-grid">
              {group.articles.map((art, artIndex) => (
                <div
                  key={artIndex}
                  className="glass-panel article-card"
                  onClick={() => onSelectArticle(art.id)}
                >
                  <div className="article-card-header">
                    <span className="article-domain-badge">
                      {getDomainName(art.url)}
                    </span>
                  </div>

                  <h4 className="article-card-title">{art.title}</h4>
                  
                  <p className="article-card-excerpt">
                    {art.summary_vi || 'Xem bản làm sạch nội dung bài viết và tóm tắt chi tiết bằng trí tuệ nhân tạo.'}
                  </p>

                  <div className="article-card-footer">
                    <span className="learning-count-badge">
                      <GraduationCap size={16} />
                      {art.phrases_english?.length || 0} từ vựng hay
                    </span>
                    
                    <span className="read-btn">
                      Đọc ngay
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        !loading && (
          <div className="glass-panel empty-state">
            <div className="empty-icon-wrapper">
              <BookOpen size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-300 mb-1">Không tìm thấy bài viết nào</h3>
            <p className="text-slate-500 max-w-sm mx-auto text-sm">
              {searchQuery ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc tìm kiếm.' : 'Chưa có bài viết nào được Admin chọn lọc đăng lên. Hãy vào cổng Admin để đăng bài đầu tiên!'}
            </p>
          </div>
        )
      )}
    </div>
  );
}
