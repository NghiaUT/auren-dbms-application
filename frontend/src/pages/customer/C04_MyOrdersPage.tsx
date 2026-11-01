// ============================================================================
// File: frontend/src/pages/customer/C04_MyOrdersPage.tsx
// Mã màn hình: C04 | Route: /account/orders | FR: FR7, FR8, FR9
// Vai trò: Màn hình Đơn hàng của tôi (Customer Dashboard):
//          - Hiển thị hồ sơ khách hàng, chiết khấu hạng thành viên Patron
//          - Danh sách đơn hàng cá nhân, lọc theo trạng thái
//          - Xem chi tiết dòng hàng, số serial Limited, lịch thanh toán đợt
//          - Thanh toán trực tiếp các khoản chờ (FR7) và Huỷ đơn hàng (FR9)
// Refactored: Container page composing modular components from components/customer/orders
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../auth/useAuth';
import {
  getMyOrdersApi,
  getOrderDetailApi,
  cancelOrderApi,
  payPaymentApi,
} from '../../api/order.api';
import type { OrderDetail, OrderSummary } from '../../types';
import {
  CustomerProfileHeader,
  OrderStatusFilter,
  OrderCardList,
  OrderDetailModal,
  OrdersPagination,
} from '../../components/customer/orders';
import { useToast } from '../../context/ToastContext';

export const C04_MyOrdersPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal chi tiết đơn hàng
  const [activeOrderDetail, setActiveOrderDetail] = useState<OrderDetail | null>(null);
  const [, setDetailLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Tải danh sách đơn hàng
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMyOrdersApi({
        status: selectedStatus || undefined,
        page: currentPage,
        limit: 8,
      });
      setOrders(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      console.error('Lỗi khi tải đơn hàng:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Xem chi tiết đơn
  const handleViewDetail = async (orderId: number) => {
    setDetailLoading(true);
    setActionMessage(null);
    try {
      const detail = await getOrderDetailApi(orderId);
      setActiveOrderDetail(detail);
    } catch (err) {
      console.error('Lỗi khi tải chi tiết đơn hàng:', err);
      toast.error(err, 'Không thể tải chi tiết đơn hàng.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Thanh toán một khoản
  const handlePayPayment = async (paymentId: number) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      await payPaymentApi(paymentId, 'bank_transfer');
      setActionMessage('Ghi nhận thanh toán thành công!');
      toast.success('Ghi nhận thanh toán thành công!');
      // Cập nhật lại chi tiết đơn và danh sách
      if (activeOrderDetail) {
        const refreshed = await getOrderDetailApi(activeOrderDetail.id);
        setActiveOrderDetail(refreshed);
      }
      fetchOrders();
    } catch (err: any) {
      console.error('Lỗi thanh toán:', err);
      toast.error(err, 'Không thể thanh toán khoản này.');
    } finally {
      setActionLoading(false);
    }
  };

  // Hủy đơn hàng
  const handleCancelOrder = async (orderId: number) => {
    if (
      !window.confirm(
        'Quý khách có chắc chắn muốn hủy đơn hàng này? Các bản Limited và tồn kho sẽ được giải phóng.'
      )
    ) {
      return;
    }

    setActionLoading(true);
    setActionMessage(null);
    try {
      await cancelOrderApi(orderId);
      setActionMessage('Đã hủy đơn hàng thành công.');
      toast.success('Đã hủy đơn hàng thành công.');
      if (activeOrderDetail && activeOrderDetail.id === orderId) {
        setActiveOrderDetail(null);
      }
      fetchOrders();
    } catch (err: any) {
      console.error('Lỗi hủy đơn:', err);
      toast.error(err, 'Không thể hủy đơn hàng này.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full pt-28 pb-20">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Customer Profile Banner */}
        <CustomerProfileHeader user={user} onLogout={logout} />

        {/* Status Filter Tabs */}
        <OrderStatusFilter
          selectedStatus={selectedStatus}
          onSelectStatus={(status) => {
            setSelectedStatus(status);
            setCurrentPage(1);
          }}
        />

        {/* Orders List Section */}
        <OrderCardList
          orders={orders}
          loading={loading}
          onViewDetail={handleViewDetail}
          onCancelOrder={handleCancelOrder}
        />

        {/* Pagination */}
        <OrdersPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal Chi tiết đơn hàng & Lịch thanh toán */}
      <OrderDetailModal
        order={activeOrderDetail}
        onClose={() => setActiveOrderDetail(null)}
        actionLoading={actionLoading}
        actionMessage={actionMessage}
        onPayPayment={handlePayPayment}
        onCancelOrder={handleCancelOrder}
      />
    </div>
  );
};

export default C04_MyOrdersPage;
