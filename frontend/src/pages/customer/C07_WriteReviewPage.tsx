// ============================================================================
// File: frontend/src/pages/customer/C07_WriteReviewPage.tsx
// Mã màn hình: C07 | Route: /account/orders/:id/items/:itemId/review | FR: FR10
// Vai trò: Màn hình Viết đánh giá sản phẩm — Cho phép Patron gửi cảm nhận nghệ thuật,
//          chấm điểm 1-5 sao cho tác phẩm đã hoàn tất bàn giao (delivered),
//          hoặc gỡ bỏ bài đánh giá của chính mình.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrderDetailApi } from '../../api/order.api';
import {
  createReviewApi,
  deleteReviewApi,
  getOrderItemReviewApi,
  type ReviewItem,
} from '../../api/review.api';
import type { OrderDetail, OrderItemDetail } from '../../types';
import { formatVND } from '../../utils/formatVND';
import { formatDate } from '../../utils/formatDate';
import { useToast } from '../../context/ToastContext';

const RATING_LABELS: Record<number, string> = {
  1: '1 sao: Chưa đáp ứng kỳ vọng thẩm mỹ',
  2: '2 sao: Cần hoàn thiện thêm chi tiết',
  3: '3 sao: Đạt tiêu chuẩn chế tác cao cấp',
  4: '4 sao: Tác phẩm kiến trúc tinh xảo',
  5: '5 sao: Kiệt tác nghệ thuật vượt thời gian',
};

export const C07_WriteReviewPage: React.FC = () => {
  const { id: orderIdStr, itemId: itemIdStr } = useParams<{ id: string; itemId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const orderId = parseInt(orderIdStr || '0', 10);
  const itemId = parseInt(itemIdStr || '0', 10);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [item, setItem] = useState<OrderItemDetail | null>(null);
  const [existingReview, setExistingReview] = useState<ReviewItem | null>(null);

  // Form states
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load order and item details
  useEffect(() => {
    async function loadData() {
      if (!orderId || !itemId) return;
      try {
        setLoading(true);
        setErrorMessage(null);

        const orderData = await getOrderDetailApi(orderId);
        setOrder(orderData);

        const foundItem = orderData.items.find((i) => i.id === itemId);
        if (!foundItem) {
          setErrorMessage('Không tìm thấy dòng sản phẩm trong đơn hàng này.');
          return;
        }
        setItem(foundItem);

        // Kiểm tra xem đã có review chưa
        const reviewData = await getOrderItemReviewApi(itemId);
        if (reviewData) {
          setExistingReview(reviewData);
          setRating(reviewData.rating);
          setComment(reviewData.comment || '');
        }
      } catch (err: any) {
        console.error('Lỗi khi tải thông tin đơn hàng / đánh giá:', err);
        setErrorMessage(err.response?.data?.error?.message || 'Không thể tải thông tin đơn hàng.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [orderId, itemId]);

  // Xử lý gửi đánh giá
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const created = await createReviewApi({
        orderItemId: item.id,
        rating,
        comment: comment.trim() || undefined,
      });

      setExistingReview(created);
      const msg = 'Cảm nhận nghệ thuật của quý khách đã được ghi nhận và hiển thị công khai.';
      setSuccessMessage(msg);
      toast.success(msg);
    } catch (err: any) {
      console.error('Lỗi khi gửi đánh giá:', err);
      const errMsg = err.response?.data?.error?.message || 'Không thể gửi bài đánh giá lúc này.';
      setErrorMessage(errMsg);
      toast.error(err, errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Xử lý gỡ bỏ đánh giá
  const handleDelete = async () => {
    if (!existingReview) return;
    if (!window.confirm('Quý khách có chắc chắn muốn gỡ bỏ bài cảm nhận này?')) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await deleteReviewApi(existingReview.id);
      setExistingReview(null);
      setComment('');
      setRating(5);
      const msg = 'Đã gỡ bỏ bài đánh giá thành công.';
      setSuccessMessage(msg);
      toast.success(msg);
    } catch (err: any) {
      console.error('Lỗi khi xoá bài đánh giá:', err);
      const errMsg = err.response?.data?.error?.message || 'Không thể gỡ bỏ bài đánh giá.';
      setErrorMessage(errMsg);
      toast.error(err, errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center pt-24 bg-[#FAF8F3]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#A58548] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-serif text-sm text-[#7B6E64] uppercase tracking-widest">Đang tải hồ sơ đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !order) {
    return (
      <div className="w-full pt-28 pb-20 bg-[#FAF8F3]">
        <div className="max-w-xl mx-auto px-6 text-center space-y-6">
          <h1 className="font-serif text-3xl text-[#0D0703]">Không thể mở đánh giá</h1>
          <p className="font-sans text-sm text-[#7B6E64]">{errorMessage}</p>
          <Link
            to="/account/orders"
            className="inline-block bg-[#271E18] text-[#FAF8F3] px-8 py-3 text-xs uppercase tracking-widest font-semibold rounded-[2px]"
          >
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  const isDelivered = order?.status === 'delivered';
  const orderCode = `AUR-2026-${String(orderId).padStart(4, '0')}`;

  return (
    <div className="w-full pt-28 pb-24 bg-[#FAF8F3] min-h-screen text-[#0D0703]">
      <div className="max-w-3xl mx-auto px-6 md:px-8 space-y-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-sans text-[#7B6E64]">
          <Link to="/" className="hover:text-[#0D0703] transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to="/account/orders" className="hover:text-[#0D0703] transition-colors">Đơn hàng của tôi</Link>
          <span>/</span>
          <span className="text-[#0D0703] font-medium">{orderCode}</span>
          <span>/</span>
          <span className="text-[#A58548] font-medium">Gửi cảm nhận nghệ thuật</span>
        </nav>

        {/* Header Tiêu đề */}
        <div className="space-y-2 border-b border-[#D2C8BA]/60 pb-6">
          <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#A58548] block">
            Patron Artistry Feedback
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#0D0703] font-normal">
            Cảm nhận & Đánh giá tác phẩm
          </h1>
          <p className="font-sans text-xs text-[#7B6E64] leading-relaxed">
            Mỗi cảm nhận từ Quý Patron là nguồn tư liệu quý báu để các nghệ nhân Atelier hoàn thiện kỹ nghệ chế tác thủ công.
          </p>
        </div>

        {/* Thông báo điều kiện Delivered */}
        {!isDelivered && (
          <div className="p-4 bg-amber-50 border border-amber-300/80 rounded-[2px] text-xs text-amber-900 flex items-start gap-3">
            <span className="text-base leading-none">⚠️</span>
            <div className="space-y-1">
              <p className="font-semibold uppercase tracking-wider text-[11px]">Đơn hàng chưa hoàn tất bàn giao</p>
              <p>
                Trạng thái hiện tại của đơn hàng là <strong>{order?.status}</strong>. Quý khách chỉ có thể gửi bài cảm nhận nghệ thuật sau khi tác phẩm đã được bàn giao và nghiệm thu White-Glove hoàn tất (trạng thái <strong>delivered</strong>).
              </p>
            </div>
          </div>
        )}

        {/* Thông báo Thành công / Thất bại */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-[2px] text-xs text-emerald-900 flex items-center justify-between">
            <span>✓ {successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-700 font-bold ml-4">✕</button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-[2px] text-xs text-red-900 flex items-center justify-between">
            <span>⚠ {errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-red-700 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Thẻ tóm tắt tác phẩm (Artifact Card) */}
        {item && (
          <div className="p-6 bg-[#F6F3ED] border border-[#D2C8BA]/60 rounded-[2px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#271E18] text-[#FAF8F3] rounded-[2px] flex items-center justify-center font-serif text-2xl font-bold flex-shrink-0">
                {item.productName.charAt(0)}
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg text-[#0D0703] font-medium">{item.productName}</h3>
                <p className="font-sans text-xs text-[#7B6E64]">
                  Hoàn thiện: {item.finish || 'Tiêu chuẩn'} • Kích thước: {item.size || 'Mặc định'}
                </p>
                {item.serialNo && (
                  <span className="inline-block px-2 py-0.5 bg-[#FAF8F3] border border-[#A58548]/40 text-[#A58548] font-mono text-[10px] font-bold rounded-[1px]">
                    Bản số độc bản: {item.serialNo}
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-[#D2C8BA]/50 pt-3 sm:pt-0 sm:pl-6 text-xs space-y-1 font-sans">
              <span className="text-[#7B6E64] block">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-[#0D0703]">{orderCode}</span>
              <span className="text-[#7B6E64] block mt-1">Giá trị: {formatVND(item.unitPrice * item.quantity)}</span>
            </div>
          </div>
        )}

        {/* Khung Đánh giá Thẩm mỹ */}
        <div className="bg-[#FAF8F3] border border-[#D2C8BA] p-8 rounded-[2px] shadow-sm space-y-6">

          {/* Nếu đã có đánh giá */}
          {existingReview ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#D2C8BA]/40">
                <div>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-[1px] border border-emerald-200">
                    Đã đăng cảm nhận nghệ thuật
                  </span>
                  <span className="text-xs text-[#7B6E64] font-sans ml-3">
                    Ngày đăng: {formatDate(existingReview.createdAt)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="text-xs text-red-800 hover:text-red-900 underline font-sans font-medium uppercase tracking-wider"
                >
                  Gỡ bỏ bài đánh giá
                </button>
              </div>

              {/* Số sao đã chấm */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#7B6E64] font-semibold block">
                  Đánh giá mức độ hoàn thiện
                </span>
                <div className="flex items-center gap-1.5 text-2xl text-[#A58548]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>{star <= existingReview.rating ? '★' : '☆'}</span>
                  ))}
                  <span className="text-xs font-sans text-[#0D0703] ml-3 font-medium">
                    {RATING_LABELS[existingReview.rating]}
                  </span>
                </div>
              </div>

              {/* Nội dung nhận xét */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] uppercase tracking-wider text-[#7B6E64] font-semibold block">
                  Nội dung chia sẻ từ Quý Patron
                </span>
                <div className="p-4 bg-[#F6F3ED] border border-[#D2C8BA]/50 rounded-[2px] font-sans text-xs text-[#0D0703] leading-relaxed italic">
                  "{existingReview.comment || 'Khách hàng không để lại nhận xét chi tiết.'}"
                </div>
              </div>

              {/* Nút quay lại */}
              <div className="pt-4 flex items-center justify-between">
                <Link
                  to="/account/orders"
                  className="inline-block text-xs uppercase tracking-wider text-[#7B6E64] hover:text-[#0D0703] transition-colors"
                >
                  ← Quay lại danh sách đơn hàng
                </Link>

                <Link
                  to={existingReview?.productId ? `/products/${existingReview.productId}` : '/products'}
                  className="inline-block bg-[#271E18] text-[#FAF8F3] px-6 py-2.5 text-xs uppercase tracking-wider font-semibold rounded-[2px]"
                >
                  Xem tác phẩm trên bộ sưu tập
                </Link>
              </div>
            </div>
          ) : (
            /* Form nhập đánh giá mới */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Interactive Star Rating */}
              <div className="space-y-2">
                <label className="block text-xs font-sans uppercase tracking-wider text-[#0D0703] font-semibold">
                  1. Mức độ hoàn thiện thủ công & thẩm mỹ <span className="text-red-700">*</span>
                </label>

                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const currentActive = (hoverRating !== null ? hoverRating : rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        disabled={!isDelivered}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(star)}
                        className={`text-3xl transition-transform hover:scale-125 focus:outline-none ${
                          currentActive ? 'text-[#A58548]' : 'text-[#D2C8BA]'
                        } ${!isDelivered ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        ★
                      </button>
                    );
                  })}
                  <span className="text-xs font-sans text-[#7B6E64] ml-3 italic">
                    {RATING_LABELS[hoverRating !== null ? hoverRating : rating]}
                  </span>
                </div>
              </div>

              {/* 2. Commentary Textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-sans uppercase tracking-wider text-[#0D0703] font-semibold">
                  2. Cảm nhận về chất liệu, độ hoàn thiện và dịch vụ bàn giao White-Glove
                </label>
                <textarea
                  rows={5}
                  disabled={!isDelivered || submitting}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ cảm nhận chân thực của quý khách về: vân gỗ, chất da, độ êm ái, hay thái độ phục vụ của đội ngũ chuyên viên bàn giao..."
                  className="w-full bg-[#FAF8F3] border border-[#D2C8BA] p-4 text-xs text-[#0D0703] placeholder-[#7B6E64]/60 rounded-[1px] focus:outline-none focus:border-[#A58548] leading-relaxed disabled:bg-[#ECE8E1] disabled:cursor-not-allowed"
                />
                <div className="flex items-center justify-between text-[10px] text-[#7B6E64]">
                  <span>Tối đa 2000 ký tự.</span>
                  <span>{comment.length}/2000</span>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link
                  to="/account/orders"
                  className="text-xs uppercase tracking-wider text-[#7B6E64] hover:text-[#0D0703] transition-colors"
                >
                  ← Quay lại danh sách đơn
                </Link>

                <button
                  type="submit"
                  disabled={!isDelivered || submitting}
                  className={`w-full sm:w-auto px-8 py-3.5 text-xs font-sans font-bold uppercase tracking-[0.2em] rounded-[2px] transition-all shadow-md ${
                    !isDelivered || submitting
                      ? 'bg-[#D2C8BA] text-[#7B6E64] cursor-not-allowed'
                      : 'bg-[#271E18] text-[#FAF8F3] hover:bg-[#0D0703] active:translate-y-0.5'
                  }`}
                >
                  {submitting ? 'Đang gửi cảm nhận...' : 'Đăng cảm nhận nghệ thuật'}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
