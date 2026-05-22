import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Sparkles, LogOut, CheckCircle, Globe, GraduationCap } from 'lucide-react';
import InputForm from './InputForm.jsx';

/**
 * Component AdminPanel: Cổng ẩn cho phép quản trị viên đăng bài tuyển chọn
 * @param {object} props
 * @param {function} props.onArticlePublished - Callback kích hoạt tải lại danh sách bài viết từ trang chủ
 */
export default function AdminPanel({ onArticlePublished }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Trạng thái Form đăng bài
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState('english');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
    if (pin === '1234') { // Mật khẩu PIN mặc định bảo mật
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
  };

  // Xử lý gửi link cào và đăng bài viết
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

      setSuccessMessage(`🎉 Tuyệt vời! Bài viết "${result.article.title}" đã được AI phân tích và ĐĂNG lên Trang chủ Độc giả thành công!`);
      setUrl(''); // Xóa url cũ để chuẩn bị cho bài viết tiếp theo
      
      // Báo hiệu cho App component tải lại danh sách bài viết mới
      if (onArticlePublished) {
        onArticlePublished();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  // NẾU CHƯA XÁC THỰC PIN -> HIỂN THỊ MÀN HÌNH KHÓA BẢO MẬT
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

  // NẾU ĐÃ ĐĂNG NHẬP ADMIN THÀNH CÔNG -> HIỂN THỊ TRÌNH ĐĂNG BÀI
  return (
    <div className="animate-fadeIn">
      {/* HEADER QUẢN TRỊ */}
      <div className="admin-header-row">
        <h2 className="admin-title">
          <Sparkles className="text-violet-400" size={24} />
          <span>Bảng điều khiển tuyển chọn (Curator Workspace)</span>
        </h2>
        <button className="btn-secondary flex items-center gap-2" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Đăng xuất Admin</span>
        </button>
      </div>

      {/* THÔNG BÁO THÀNH CÔNG NẾU ĐĂNG BÀI XONG */}
      {successMessage && (
        <div className="glass-panel mb-8 border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3">
          <CheckCircle size={22} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-emerald-400 mb-1">Đăng bài thành công</h4>
            <p className="text-slate-300 text-sm leading-relaxed">{successMessage}</p>
          </div>
        </div>
      )}

      {/* FORM NHẬP LINK BÁO TUYỂN CHỌN */}
      <InputForm
        url={url}
        setUrl={setUrl}
        mode={mode}
        setMode={setMode}
        onSubmit={handlePublish}
        loading={loading}
        error={error}
      />

      {/* HƯỚNG DẪN DÀNH CHO ADMIN */}
      <div className="glass-panel mt-8">
        <h3 className="font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Globe size={18} className="text-indigo-400" />
          Hướng dẫn tuyển chọn và vận hành báo chí AI:
        </h3>
        <ul className="text-slate-400 text-sm space-y-2 pl-5 list-disc leading-relaxed">
          <li>Bạn có thể sao chép bất kỳ liên kết bài viết tiếng Việt hoặc tiếng Anh nào từ các trang báo lớn (VnExpress, Tuổi Trẻ, BBC, New York Times, v.v.).</li>
          <li>Chọn chế độ **Dành cho người học tiếng Anh** đối với các bài viết tiếng Anh để AI tự động dịch thuật song ngữ và bóc tách từ vựng nổi bật hỗ trợ độc giả.</li>
          <li>Sau khi bạn nhấn nút **"Rút gọn bài báo"**, hệ thống sẽ xử lý trong 5-10 giây để cào HTML sạch, gửi AI dịch thuật, lưu vào CSDL và tự động đăng bài viết lên Trang chủ Độc giả.</li>
        </ul>
      </div>
    </div>
  );
}
