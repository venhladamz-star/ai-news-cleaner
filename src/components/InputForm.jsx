import React from 'react';
import { Link as LinkIcon, Sparkles, ShieldAlert } from 'lucide-react';

/**
 * Component InputForm: Form nhập link bài báo và tùy chọn chế độ tóm tắt dành cho Admin
 */
export default function InputForm({ url, setUrl, mode, setMode, onSubmit, loading, error }) {
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit();
  };

  return (
    <div className="glass-panel form-card">
      <form onSubmit={handleSubmit} className="form-layout">
        
        {/* Nhập link URL */}
        <div className="input-group">
          <label htmlFor="url-input" className="input-label">
            <LinkIcon size={16} className="text-indigo-400" />
            Dán link bài báo muốn tuyển chọn đăng
          </label>
          <div className="input-wrapper">
            <input
              id="url-input"
              type="url"
              className="url-input"
              placeholder="https://vnexpress.net/tin-tuc-tuyen-chon-hom-nay"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              required
            />
            <LinkIcon className="input-icon" size={20} />
          </div>
        </div>

        {/* Cấu hình chế độ & Nút bấm gửi đi */}
        <div className="controls-row">
          
          {/* Bộ chọn chế độ tóm tắt */}
          <div className="input-group">
            <label htmlFor="mode-select" className="input-label">
              <Sparkles size={16} className="text-emerald-400" />
              Chọn chế độ AI tóm tắt
            </label>
            <div className="select-wrapper">
              <select
                id="mode-select"
                className="custom-select"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                disabled={loading}
              >
                <option value="english">Dành cho người học Tiếng Anh (Song ngữ + Từ vựng)</option>
                <option value="short">Tóm tắt: Bản ngắn gọn (3-4 câu)</option>
                <option value="bullets">Tóm tắt: Dạng danh sách ý chính (Bullets)</option>
              </select>
            </div>
          </div>

          {/* Nút bấm Rút gọn bài báo */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <>
                <svg className="spinner" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    style={{ opacity: 0.2 }}
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Đang phân tích & Đăng...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Phân tích & Đăng bài</span>
              </>
            )}
          </button>
        </div>

        {/* Hiển thị lỗi nếu có */}
        {error && (
          <div className="error-banner">
            <ShieldAlert size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

      </form>
    </div>
  );
}
