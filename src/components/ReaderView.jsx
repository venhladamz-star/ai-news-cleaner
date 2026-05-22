import React from 'react';
import { ArrowLeft, Calendar, Globe } from 'lucide-react';
import SummaryDisplay from './SummaryDisplay.jsx';

/**
 * Component ReaderView: Hiển thị chi tiết bài báo sạch kèm phân tích AI
 * @param {object} props
 * @param {object} props.article - Đối tượng dữ liệu bài báo đầy đủ
 * @param {function} props.onBack - Hàm xử lý quay lại Trang chủ Độc giả
 */
export default function ReaderView({ article, onBack }) {
  if (!article) return null;

  // Tự động phát hiện chế độ hiển thị phù hợp nhất:
  // Nếu có cụm từ tiếng Anh thì ưu tiên hiển thị tab học tiếng anh, ngược lại nếu có bullets thì hiện bullets, còn lại hiện tóm tắt ngắn.
  const getBestDisplayMode = () => {
    if (article.phrases_english && article.phrases_english.length > 0) {
      return 'english';
    }
    if (article.bullets && article.bullets.length > 0) {
      return 'bullets';
    }
    return 'short';
  };

  const bestMode = getBestDisplayMode();

  // Định dạng ngày hiển thị thân thiện (ví dụ: 22/05/2026)
  const formatPublishDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Trích xuất tên domain
  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch (e) {
      return 'Trang tin';
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* NÚT QUAY LẠI VÀ THỜI GIAN */}
      <div className="reader-back-btn flex justify-between items-center flex-wrap gap-4 mb-6">
        <button className="btn-secondary flex items-center gap-2" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Quay lại Trang chủ</span>
        </button>

        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            Đăng vào lúc: {formatPublishDate(article.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Globe size={14} />
            Nguồn: <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">{getDomain(article.url)}</a>
          </span>
        </div>
      </div>

      {/* HIỂN THỊ CHÍNH (ĐỌC BÁO & PHÂN TÍCH AI) */}
      <SummaryDisplay data={article} selectedMode={bestMode} />
    </div>
  );
}
