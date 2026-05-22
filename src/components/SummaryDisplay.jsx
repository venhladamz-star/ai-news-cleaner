import React, { useState } from 'react';
import { BookOpen, Sparkles, CheckCircle2, Languages, GraduationCap } from 'lucide-react';

/**
 * Component SummaryDisplay: Hiển thị giao diện 2 cột đọc báo sạch và tóm tắt AI
 */
export default function SummaryDisplay({ data, selectedMode }) {
  const [activeLangTab, setActiveLangTab] = useState('vi'); // 'vi' hoặc 'en'

  if (!data) return null;

  const { title, cleanedHtml, summary_vi, summary_en, bullets, phrases_english } = data;

  // Hàm in đậm từ vựng trong ví dụ
  const formatExampleText = (text) => {
    if (!text) return '';
    const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="results-grid">
      
      {/* CỘT TRÁI: CLEAN READER */}
      <div className="glass-panel reader-container">
        <div className="reader-header">
          <span className="reader-badge">
            <BookOpen size={16} />
            Chế độ đọc sạch (Clean Reader)
          </span>
          <span className="text-xs text-slate-500 font-medium">Bản làm sạch bằng Cheerio</span>
        </div>
        
        <div>
          <h1 className="article-title">{title}</h1>
        </div>

        <div 
          className="reader-body"
          dangerouslySetInnerHTML={{ __html: cleanedHtml }}
        />
      </div>

      {/* CỘT PHẢI: AI SUMMARY PANEL */}
      <div className="glass-panel summary-container">
        <div className="summary-header">
          <span className="ai-badge">
            <Sparkles size={16} />
            Kết quả phân tích từ AI
          </span>
        </div>

        <div className="summary-body">
          
          {/* CHẾ ĐỘ 1: SHORT SUMMARY */}
          {selectedMode === 'short' && (
            <div className="animate-fadeIn">
              <div className="summary-text-box">
                <div className="section-label">
                  <Sparkles size={14} />
                  Tóm tắt Tiếng Việt
                </div>
                <p className="paragraph-text">{summary_vi || 'Đang cập nhật tóm tắt...'}</p>
              </div>
              
              {summary_en && (
                <div className="summary-text-box en">
                  <div className="section-label en">
                    <Languages size={14} />
                    English Summary
                  </div>
                  <p className="paragraph-text">{summary_en}</p>
                </div>
              )}
            </div>
          )}

          {/* CHẾ ĐỘ 2: BULLET POINTS */}
          {selectedMode === 'bullets' && (
            <div className="animate-fadeIn">
              <div className="summary-text-box">
                <div className="section-label">
                  <ListIcon size={14} />
                  Các ý chính quan trọng
                </div>
                <ul className="bullets-list">
                  {bullets && bullets.length > 0 ? (
                    bullets.map((bullet, index) => (
                      <li key={index} className="bullet-item">
                        <CheckCircle2 size={18} className="bullet-icon text-emerald-400" />
                        <span>{bullet}</span>
                      </li>
                    ))
                  ) : (
                    <li className="bullet-item text-slate-400">Không có dữ liệu ý chính.</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* CHẾ ĐỘ 3: ENGLISH LEARNERS */}
          {selectedMode === 'english' && (
            <div className="animate-fadeIn">
              <div className="tabs-navigation">
                <button
                  type="button"
                  className={`tab-btn ${activeLangTab === 'vi' ? 'active' : ''}`}
                  onClick={() => setActiveLangTab('vi')}
                >
                  <Languages size={16} />
                  Tiếng Việt
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeLangTab === 'en' ? 'active' : ''}`}
                  onClick={() => setActiveLangTab('en')}
                >
                  <GraduationCap size={16} />
                  English
                </button>
              </div>

              {activeLangTab === 'vi' ? (
                <div className="summary-text-box">
                  <div className="section-label">Tóm tắt tiếng Việt</div>
                  <p className="paragraph-text">{summary_vi || 'Đang cập nhật tóm tắt...'}</p>
                </div>
              ) : (
                <div className="summary-text-box en">
                  <div className="section-label en">English Summary</div>
                  <p className="paragraph-text">{summary_en || 'English summary is not available.'}</p>
                </div>
              )}

              <div className="vocabulary-section">
                <h3 className="vocabulary-title">
                  <GraduationCap size={20} className="text-violet-400" />
                  Từ vựng & Cụm từ hay (Vocabulary)
                </h3>
                
                <div className="vocab-grid">
                  {phrases_english && phrases_english.length > 0 ? (
                    phrases_english.map((item, index) => (
                      <div key={index} className="vocab-card">
                        <div className="vocab-header">
                          <span className="vocab-original">{item.original}</span>
                          <span className="vocab-meaning">{item.meaning}</span>
                        </div>
                        {item.example && (
                          <div className="vocab-example">
                            <strong>Ví dụ:</strong> {formatExampleText(item.example)}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic">Không tìm thấy từ vựng học tập trong bài báo này.</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

function ListIcon({ size = 16, className = "" }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  );
}
