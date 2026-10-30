// ============================================================================
// File: frontend/src/pages/sales/S03_OrderProcessPage.tsx
// Mã màn hình: S03 | Route: /sales/orders/:id | FR: FR11, FR9
// Vai trò: Xử lý đơn hàng Sales — Hiển thị đầy đủ thông tin khách hàng, địa chỉ,
//          các tác phẩm đặt may đo, các bước chuyển trạng thái (confirmed -> in_production
//          -> shipped -> delivered) kèm modal chọn ngày giao dự kiến và huỷ đơn an toàn.
// Refactored: Container page composing modular components from components/sales/order-process
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SalesHeaderNav } from '../../components/SalesHeaderNav';
import {
  getSalesOrderDetailApi,
  updateOrderStatusApi,
  cancelOrderBySalesApi,
} from '../../api/sales.api';
import type { OrderDetail, OrderStatus } from '../../types';
import {
  OrderProcessHeader,
  OrderStatusWorkflow,
  OrderItemsTable,
  OrderCustomerSpatialCard,
} from '../../components/sales/order-process';

export const S03_OrderProcessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal huỷ đơn
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  const fetchOrderDetail = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const data = await getSalesOrderDetailApi(orderId);
      setOrder(data);
    } catch (err: any) {
      console.error('Lỗi khi nạp chi tiết đơn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const handleUpdateStatus = async (targetStatus: OrderStatus, deliveryDate?: string | null) => {
    try {
      setActionLoading(true);
      setFeedback(null);
      await updateOrderStatusApi(orderId, {
        status: targetStatus,
        deliveryDate,
      });
      setFeedback({
        text: `Đã cập nhật trạng thái đơn sang "${targetStatus}" thành công!`,
        type: 'success',
      });
      await fetchOrderDetail();
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message || 'Không thể chuyển đổi trạng thái đơn hàng này.';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (cancelReason: string) => {
    try {
      setActionLoading(true);
      setFeedback(null);
      await cancelOrderBySalesApi(orderId, cancelReason);
      setFeedback({
        text: 'Đơn hàng đã được huỷ bỏ và hoàn trả tồn kho thành công.',
        type: 'success',
      });
      setShowCancelModal(false);
      await fetchOrderDetail();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Không thể huỷ đơn hàng này.';
      setFeedback({ text: msg, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-[#FCF9F3]">
        <SalesHeaderNav />
        <div className="max-w-[1400px] mx-auto px-6 py-20 text-center text-xs text-[#7B6E64]">
          Đang nạp dữ liệu hồ sơ đơn hàng...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-[#FCF9F3]">
        <SalesHeaderNav />
        <div className="max-w-[1400px] mx-auto px-6 py-20 text-center">
          <p className="font-serif text-2xl text-[#0D0703]">Không tìm thấy đơn hàng</p>
          <p className="font-sans text-xs text-[#7B6E64] mt-2">
            Đơn hàng không tồn tại hoặc bạn không được phân công phụ trách đơn này.
          </p>
          <Link to="/sales/orders" className="btn-auren-outline mt-6 inline-block text-xs py-2 px-4">
            ← Quay lại hàng đợi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#FCF9F3]">
      <SalesHeaderNav />

      <main className="max-w-[1600px] mx-auto px-6 md:px-12">
        {/* Navigation Breadcrumb & Actions */}
        <OrderProcessHeader
          order={order}
          feedback={feedback}
          onClearFeedback={() => setFeedback(null)}
          onOpenCancelModal={() => setShowCancelModal(true)}
        />

        {/* BANNER THÔNG TIN ĐƠN HÀNG & TIẾN TRÌNH */}
        <OrderStatusWorkflow
          order={order}
          actionLoading={actionLoading}
          onUpdateStatus={handleUpdateStatus}
          onCancelOrder={handleCancelOrder}
          showCancelModal={showCancelModal}
          onCloseCancelModal={() => setShowCancelModal(false)}
        />

        {/* GRID 2 CỘT: CHI TIẾT KHÁCH HÀNG & DÒNG HÀNG TÁC PHẨM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cột Trái (8 Cột): Danh sách tác phẩm */}
          <div className="lg:col-span-8 space-y-6">
            <OrderItemsTable items={order.items} />
          </div>

          {/* Cột Phải (4 Cột): Thông tin Khách hàng, Giao nhận & Giá trị */}
          <div className="lg:col-span-4 space-y-6">
            <OrderCustomerSpatialCard order={order} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default S03_OrderProcessPage;
