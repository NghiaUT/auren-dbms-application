import { useCallback, useState } from 'react';
import { getAdminReviews } from '../../api/admin.api';
import { deleteReviewApi } from '../../api/review.api';
import { OrdersPagination } from '../../components/customer/orders/OrdersPagination';
import { useToast } from '../../context/ToastContext';
import { AdminLayout } from '../../layouts/AdminLayout';
import { formatDateTime } from '../../utils/formatDate';
import { useAdminList } from './useAdminList';

export function A10_ReviewModerationPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [q, setQuery] = useState('');
  const [rating, setRating] = useState<number>();
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const load = useCallback(
    (signal: AbortSignal) => getAdminReviews({ page, q, rating }, signal),
    [page, q, rating],
  );
  const { result, loading, error, refresh } = useAdminList(load);

  async function moderate(id: number) {
    if (deleting || !window.confirm(`Xóa vĩnh viễn đánh giá #${id}?`)) return;
    setDeleting(true);
    try {
      await deleteReviewApi(id);
      if (result?.data.length === 1 && page > 1) setPage(page - 1);
      refresh();
      toast.success('Đã xóa đánh giá.');
    } catch (err) {
      toast.error(err, 'Không thể xóa đánh giá.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminLayout>
      <section className="space-y-5">
        <h1 className="font-serif text-3xl">Kiểm duyệt đánh giá</h1>
        <form className="flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(search.trim()); }}>
          <input aria-label="Tìm theo khách hàng hoặc sản phẩm" placeholder="Khách hàng hoặc sản phẩm" maxLength={200} className="rounded border p-2" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select aria-label="Lọc theo số sao" className="rounded border p-2" value={rating ?? ''} onChange={(e) => { setRating(Number(e.target.value) || undefined); setPage(1); }}>
            <option value="">Mọi mức sao</option>
            {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} sao</option>)}
          </select>
          <button className="rounded border border-stone-400 px-4 py-2">Tìm kiếm</button>
        </form>
        {loading && <p role="status">Đang tải đánh giá…</p>}
        {error && <p role="alert">{error} <button className="underline" onClick={refresh}>Thử lại</button></p>}
        {!loading && !error && result && (
          result.data.length === 0 ? <p>Không tìm thấy đánh giá.</p> : (
            <>
              <div className="overflow-x-auto rounded border border-stone-300 bg-white">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-stone-100"><tr>
                    {['Khách hàng', 'Sản phẩm', 'Số sao', 'Nhận xét', 'Ngày gửi', 'Thao tác'].map((label) => <th key={label} scope="col" className="p-3">{label}</th>)}
                  </tr></thead>
                  <tbody>{result.data.map((review) => (
                    <tr key={review.id} className="border-t align-top">
                      <td className="p-3">{review.customerName}</td>
                      <td className="p-3">{review.productName}</td>
                      <td className="whitespace-nowrap p-3">{review.rating} / 5</td>
                      <td className="max-w-sm break-words p-3">{review.comment || '—'}</td>
                      <td className="p-3">{formatDateTime(review.createdAt)}</td>
                      <td className="p-3"><button disabled={deleting} className="text-red-800 underline disabled:opacity-50" onClick={() => void moderate(review.id)}>Xóa</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <OrdersPagination currentPage={page} totalPages={result.meta.totalPages} onPageChange={setPage} />
            </>
          )
        )}
      </section>
    </AdminLayout>
  );
}
