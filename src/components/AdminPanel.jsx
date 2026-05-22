import React, { useState, useEffect } from 'react';
import { 
  Lock, Unlock, Sparkles, LogOut, CheckCircle, Globe, 
  Edit2, Trash2, Save, X, Plus, Trash, FileText, Settings, ExternalLink 
} from 'lucide-react';
import InputForm from './InputForm.jsx';

/**
 * Component AdminPanel: Cổng ẩn dành cho quản trị viên đăng bài, chỉnh sửa, và xóa bài viết
 * @param {object} props
 * @param {Array} props.articles - Danh sách bài viết truyền từ App.jsx
 * @param {function} props.onArticlesUpdated - Callback kích hoạt tải lại danh sách bài viết từ trang chủ
 */
export default function AdminPanel({ articles = [], onArticlesUpdated }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Quản lý Tabs trong Admin Panel
  const [activeSubTab, setActiveSubTab] = useState('publish'); // 'publish' hoặc 'manage'

  // Trạng thái Form đăng bài mới
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState('english');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Trạng thái Chỉnh sửa bài viết
  const [editingArticle, setEditingArticle] = useState(null); // Bài viết đang được chọn để sửa
  const [editTitle, setEditTitle] = useState('');
  const [editSummaryVi, setEditSummaryVi] = useState('');
  const [editSummaryEn, setEditSummaryEn] = useState('');
  const [editBullets, setEditBullets] = useState([]);
  const [editPhrases, setEditPhrases] = useState([]);
  const [editLoading, setEditLoading] = useState(false);

  // Trạng thái Xóa bài viết
  const [deletingArticle, setDeletingArticle] = useState(null); // Bài viết đang chọn để xóa
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Tự động kiểm tra trạng thái đăng nhập admin qua localStorage khi load trang
  useEffect(() => {
    const savedPin = localStorage.getItem('admin_pin');
    if (savedPin === '1234') { // PIN mặc định
      setIsAuthenticated(true);
      setPin(savedPin);
    }
  }, []);

  // Xác thực mã PIN
  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsAuthenticated(true);
      setPinError('');
      localStorage.setItem('admin_pin', pin);
    } else {
      setPinError('Mã PIN không chính xác. Vui lòng thử lại.');
      setPin('');
    }
  };

  // Đăng xuất Admin
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPin('');
    localStorage.removeItem('admin_pin');
    setSuccessMessage('');
    setError('');
    setEditingArticle(null);
    setDeletingArticle(null);
  };

  // Xử lý gửi link cào và đăng bài viết mới
  const handlePublish = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/clean-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, mode, pin })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Đăng bài viết thất bại. Hãy kiểm tra lại link báo.');
      }

      setSuccessMessage(`🎉 Đăng bài thành công! Bài viết "${result.article.title}" đã được hiển thị trên trang chủ.`);
      setUrl('');
      
      if (onArticlesUpdated) {
        onArticlesUpdated();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  // ✏️ BẮT ĐẦU CHỈNH SỬA BÀI VIẾT
  const startEdit = (article) => {
    setEditingArticle(article);
    setEditTitle(article.title || '');
    setEditSummaryVi(article.summary_vi || '');
    setEditSummaryEn(article.summary_en || '');
    setEditBullets(article.bullets ? [...article.bullets] : []);
    setEditPhrases(article.phrases_english ? JSON.parse(JSON.stringify(article.phrases_english)) : []);
    setSuccessMessage('');
    setError('');
  };

  // Hủy chỉnh sửa
  const cancelEdit = () => {
    setEditingArticle(null);
  };

  // Các hàm tiện ích cho chỉnh sửa Bullet Points
  const handleAddBullet = () => {
    setEditBullets([...editBullets, '']);
  };

  const handleEditBullet = (index, value) => {
    const updated = [...editBullets];
    updated[index] = value;
    setEditBullets(updated);
  };

  const handleRemoveBullet = (index) => {
    setEditBullets(editBullets.filter((_, i) => i !== index));
  };

  // Các hàm tiện ích cho chỉnh sửa Phrases (Từ vựng tiếng Anh)
  const handleAddPhrase = () => {
    setEditPhrases([...editPhrases, { original: '', meaning: '', example: '' }]);
  };

  const handleEditPhrase = (index, field, value) => {
    const updated = [...editPhrases];
    updated[index][field] = value;
    setEditPhrases(updated);
  };

  const handleRemovePhrase = (index) => {
    setEditPhrases(editPhrases.filter((_, i) => i !== index));
  };

  // 💾 LƯU THAY ĐỔI CHỈNH SỬA BÀI VIẾT (PUT)
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/articles/${editingArticle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pin,
          title: editTitle,
          summary_vi: editSummaryVi,
          summary_en: editSummaryEn,
          bullets: editBullets.filter(b => b.trim() !== ''),
          phrases_english: editPhrases.filter(p => p.original.trim() !== '')
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Cập nhật bài viết thất bại.');
      }

      setSuccessMessage(`✏️ Đã cập nhật thành công bài viết: "${editTitle}"!`);
      setEditingArticle(null);

      if (onArticlesUpdated) {
        await onArticlesUpdated();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Lỗi khi lưu chỉnh sửa.');
    } finally {
      setEditLoading(false);
    }
  };

  // 🗑️ THỰC HIỆN XÓA BÀI VIẾT (DELETE)
  const handleDeleteArticle = async () => {
    setDeleteLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/articles/${deletingArticle.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin
        },
        body: JSON.stringify({ pin }) // Dự phòng cả trong body
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Xóa bài viết thất bại.');
      }

      setSuccessMessage(`🗑️ Đã gỡ bỏ bài viết thành công khỏi hệ thống.`);
      setDeletingArticle(null);

      if (onArticlesUpdated) {
        await onArticlesUpdated();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Lỗi khi xóa bài viết.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // NẾU CHƯA XÁC THỰC PIN -> HIỂN THỊ TRANG KHÓA BẢO MẬT
  if (!isAuthenticated) {
    return (
      <div className="glass-panel admin-lock-card">
        <div className="lock-icon-wrapper">
          <Lock size={28} />
        </div>
        <h2 className="welcome-title mb-2">Khu vực Quản trị viên</h2>
        <p className="welcome-description mb-6 text-sm">
          Vui lòng nhập mã PIN quản trị để mở khóa chức năng dán link và đăng bài tuyển chọn dành cho độc giả.
        </p>

        <form onSubmit={handleVerifyPin}>
          <div className="pin-input-group">
            <input
              type="password"
              className="pin-input"
              placeholder="••••"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </div>
          {pinError && <p className="text-rose-400 text-sm mb-4">{pinError}</p>}
          <button type="submit" className="submit-btn w-full">
            <Unlock size={16} />
            <span>Mở khóa Quản trị</span>
          </button>
        </form>
      </div>
    );
  }

  // NẾU ĐÃ ĐĂNG NHẬP ADMIN THÀNH CÔNG -> HIỂN THỊ BẢNG ĐIỀU KHIỂN
  return (
    <div className="animate-fadeIn pb-16">
      {/* HEADER QUẢN TRỊ */}
      <div className="admin-header-row mb-6">
        <h2 className="admin-title">
          <Sparkles className="text-violet-400 animate-pulse" size={24} />
          <span>Curator Workspace</span>
        </h2>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* TABS ĐIỀU HƯỚNG PHÂN HỆ QUẢN TRỊ */}
      <div className="admin-tabs flex gap-2 border-b border-slate-900 pb-3 mb-8">
        <button 
          className={`nav-btn py-2 px-4 rounded-md transition ${activeSubTab === 'publish' ? 'active' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={() => { setActiveSubTab('publish'); setEditingArticle(null); }}
        >
          <Sparkles size={16} />
          <span>Đăng bài mới</span>
        </button>
        <button 
          className={`nav-btn py-2 px-4 rounded-md transition ${activeSubTab === 'manage' ? 'active' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={() => { setActiveSubTab('manage'); }}
        >
          <Settings size={16} />
          <span>Quản lý bài đăng ({articles.length})</span>
        </button>
      </div>

      {/* THÔNG BÁO KẾT QUẢ CHUNG */}
      {successMessage && (
        <div className="glass-panel mb-8 border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3">
          <CheckCircle size={22} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-grow">
            <h4 className="font-bold text-emerald-400 mb-1">Thao tác thành công</h4>
            <p className="text-slate-300 text-sm leading-relaxed">{successMessage}</p>
          </div>
          <button className="text-slate-400 hover:text-slate-200" onClick={() => setSuccessMessage('')}>
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="glass-panel mb-8 border-rose-500/20 bg-rose-500/5 flex items-start gap-3 text-rose-400">
          <X size={22} className="flex-shrink-0 mt-0.5" />
          <div className="flex-grow">
            <h4 className="font-bold mb-1">Có lỗi xảy ra</h4>
            <p className="text-sm leading-relaxed">{error}</p>
          </div>
          <button className="text-rose-400 hover:text-rose-200" onClick={() => setError('')}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* PHÂN HỆ 1: ĐĂNG BÀI BÁO MỚI */}
      {activeSubTab === 'publish' && !editingArticle && (
        <>
          <InputForm
            url={url}
            setUrl={setUrl}
            mode={mode}
            setMode={setMode}
            onSubmit={handlePublish}
            loading={loading}
            error={error}
          />

          <div className="glass-panel mt-8">
            <h3 className="font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Globe size={18} className="text-indigo-400" />
              Hướng dẫn tuyển chọn bài báo:
            </h3>
            <ul className="text-slate-400 text-sm space-y-2 pl-5 list-disc leading-relaxed">
              <li>Bạn có thể dán bất kỳ liên kết bài viết (tiếng Anh hoặc tiếng Việt) từ VnExpress, Tuổi Trẻ, BBC, CNN, New York Times...</li>
              <li>Chọn **Dành cho người học tiếng Anh** để AI tự động trích xuất các cụm từ nổi bật và ví dụ sử dụng.</li>
              <li>Mọi bài báo khi quét sẽ tự động chạy qua hệ thống Beeknoee AI đa mô hình bảo vệ để đảm bảo tóm tắt an toàn.</li>
            </ul>
          </div>
        </>
      )}

      {/* PHÂN HỆ 2: QUẢN LÝ BÀI ĐĂNG (BẢNG THẺ DANH SÁCH) */}
      {activeSubTab === 'manage' && !editingArticle && (
        <div className="glass-panel">
          <h3 className="font-bold text-slate-200 mb-6 flex items-center gap-2 border-b border-slate-900 pb-3">
            <FileText size={18} className="text-indigo-400" />
            Danh sách tất cả bài viết tuyển chọn
          </h3>

          {articles.length === 0 ? (
            <p className="text-slate-500 text-center py-8 text-sm">Chưa có bài viết nào được đăng trên hệ thống.</p>
          ) : (
            <div className="manage-list space-y-4">
              {articles.map((article) => (
                <div key={article.id} className="manage-item flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-lg bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition gap-4">
                  <div className="flex-grow max-w-full md:max-w-[70%]">
                    <span className="text-slate-500 text-xs block mb-1 font-mono">
                      {article.dateString || (article.createdAt && article.createdAt.substring(0, 10)) || 'Không rõ ngày'}
                    </span>
                    <h4 className="font-bold text-slate-200 hover:text-indigo-300 transition text-sm md:text-base truncate" title={article.title}>
                      {article.title}
                    </h4>
                    {article.url && (
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 mt-1">
                        <ExternalLink size={12} />
                        <span className="truncate max-w-[200px] md:max-w-[400px]">{article.url}</span>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button 
                      className="btn-edit-inline flex items-center gap-1.5 py-1.5 px-3 rounded text-xs bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition border border-indigo-500/20"
                      onClick={() => startEdit(article)}
                    >
                      <Edit2 size={12} />
                      <span>Sửa</span>
                    </button>
                    <button 
                      className="btn-delete-inline flex items-center gap-1.5 py-1.5 px-3 rounded text-xs bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition border border-rose-500/20"
                      onClick={() => setDeletingArticle(article)}
                    >
                      <Trash2 size={12} />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✏️ MODAL/VIEW FORM CHỈNH SỬA CHI TIẾT BÀI ĐĂNG */}
      {editingArticle && (
        <div className="glass-panel animate-fadeIn border-indigo-500/20">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-6">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Edit2 size={18} className="text-indigo-400" />
              <span>Chỉnh sửa bài đăng: "{editingArticle.title}"</span>
            </h3>
            <button className="text-slate-400 hover:text-slate-200 p-1" onClick={cancelEdit}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-6">
            {/* TIÊU ĐỀ */}
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Tiêu đề bài báo:</label>
              <input
                type="text"
                className="input-field w-full"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>

            {/* TÓM TẮT TIẾNG VIỆT */}
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Tóm tắt tiếng Việt (AI):</label>
              <textarea
                rows={4}
                className="input-field w-full text-sm leading-relaxed"
                value={editSummaryVi}
                onChange={(e) => setEditSummaryVi(e.target.value)}
                required
              />
            </div>

            {/* TÓM TẮT TIẾNG ANH */}
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Tóm tắt tiếng Anh (AI):</label>
              <textarea
                rows={4}
                className="input-field w-full text-sm leading-relaxed"
                value={editSummaryEn}
                onChange={(e) => setEditSummaryEn(e.target.value)}
                required
              />
            </div>

            {/* DANH SÁCH Ý CHÍNH (BULLET POINTS) */}
            <div className="border-t border-slate-900 pt-4">
              <div className="flex justify-between items-center mb-3">
                <label className="text-slate-300 text-sm font-semibold">Các ý chính nổi bật (Bullets):</label>
                <button type="button" className="btn-secondary py-1 px-2.5 rounded text-xs flex items-center gap-1" onClick={handleAddBullet}>
                  <Plus size={12} />
                  <span>Thêm ý chính</span>
                </button>
              </div>
              
              {editBullets.length === 0 ? (
                <p className="text-slate-500 text-xs italic mb-4">Chưa có ý chính nào. Nhấp Thêm ý chính để tạo.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {editBullets.map((bullet, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        className="input-field w-full text-sm"
                        value={bullet}
                        onChange={(e) => handleEditBullet(index, e.target.value)}
                        placeholder={`Ý chính thứ ${index + 1}`}
                        required
                      />
                      <button 
                        type="button" 
                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition"
                        onClick={() => handleRemoveBullet(index)}
                        title="Xóa ý này"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* HỌC TỪ VỰNG TIẾNG ANH (PHRASES) */}
            <div className="border-t border-slate-900 pt-4">
              <div className="flex justify-between items-center mb-3">
                <label className="text-slate-300 text-sm font-semibold">Bóc tách từ vựng nổi bật (Phrases):</label>
                <button type="button" className="btn-secondary py-1 px-2.5 rounded text-xs flex items-center gap-1" onClick={handleAddPhrase}>
                  <Plus size={12} />
                  <span>Thêm cụm từ</span>
                </button>
              </div>

              {editPhrases.length === 0 ? (
                <p className="text-slate-500 text-xs italic mb-4">Chưa có từ vựng bóc tách nào.</p>
              ) : (
                <div className="space-y-4 mb-4">
                  {editPhrases.map((phrase, index) => (
                    <div key={index} className="p-4 rounded bg-slate-950/60 border border-slate-900 relative">
                      <button 
                        type="button"
                        className="absolute top-2 right-2 text-rose-400 hover:text-rose-300 p-1"
                        onClick={() => handleRemovePhrase(index)}
                        title="Xóa từ vựng này"
                      >
                        <Trash size={14} />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                        <div>
                          <label className="block text-slate-400 text-xs mb-1">Cụm từ gốc (Original):</label>
                          <input
                            type="text"
                            className="input-field w-full text-xs"
                            value={phrase.original}
                            onChange={(e) => handleEditPhrase(index, 'original', e.target.value)}
                            placeholder="e.g. cutting-edge"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs mb-1">Giải nghĩa (Vietnamese Meaning):</label>
                          <input
                            type="text"
                            className="input-field w-full text-xs"
                            value={phrase.meaning}
                            onChange={(e) => handleEditPhrase(index, 'meaning', e.target.value)}
                            placeholder="e.g. tiên tiến nhất"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-400 text-xs mb-1">Đặt câu ví dụ (English Example):</label>
                        <input
                          type="text"
                          className="input-field w-full text-xs"
                          value={phrase.example}
                          onChange={(e) => handleEditPhrase(index, 'example', e.target.value)}
                          placeholder="e.g. This is a **cutting-edge** technology."
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* NÚT THAO TÁC */}
            <div className="flex justify-end gap-3 border-t border-slate-900 pt-4">
              <button type="button" className="btn-secondary flex items-center gap-1.5" onClick={cancelEdit}>
                <X size={16} />
                <span>Hủy bỏ</span>
              </button>
              <button type="submit" className="submit-btn flex items-center gap-1.5" disabled={editLoading}>
                <Save size={16} />
                <span>{editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 🗑️ HỘP THOẠI XÁC NHẬN XÓA BÀI VIẾT (MODAL OVERLAY GLASSMOPRHISM) */}
      {deletingArticle && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="glass-panel max-w-md w-full border-rose-500/20 animate-scaleUp">
            <h3 className="font-bold text-rose-400 flex items-center gap-2 mb-4">
              <Trash2 size={20} />
              <span>Xác nhận xóa bài viết?</span>
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Bạn có chắc chắn muốn xóa bài viết tuyển chọn: <br />
              <strong className="text-slate-100 font-semibold">"{deletingArticle.title}"</strong>?<br /><br />
              Hành động này sẽ gỡ bỏ hoàn toàn dữ liệu bài viết khỏi toàn bộ cơ sở dữ liệu (Firestore/MongoDB/Local) và **không thể hoàn tác**.
            </p>
            <div className="flex justify-end gap-3 border-t border-slate-900 pt-4">
              <button 
                type="button" 
                className="btn-secondary py-2 px-4 rounded text-sm" 
                onClick={() => setDeletingArticle(null)}
                disabled={deleteLoading}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="submit-btn bg-rose-600 hover:bg-rose-500 border-rose-600 hover:border-rose-500 py-2 px-4 rounded text-sm text-white font-medium"
                onClick={handleDeleteArticle}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Đang xóa...' : 'Xác nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
