import { useCallback, useState, type FormEvent } from 'react';
import { createInternalUser, getAdminUsers, setUserActive, type AdminUser, type InternalUserInput } from '../../api/admin.api';
import { OrdersPagination } from '../../components/customer/orders/OrdersPagination';
import { useToast } from '../../context/ToastContext';
import { AdminLayout } from '../../layouts/AdminLayout';
import type { UserRole } from '../../types';
import { formatDate } from '../../utils/formatDate';
import { useAdminList } from './useAdminList';

const emptyUser: InternalUserInput = { fullName: '', email: '', password: '', role: 'sales' };

export function A09_UserManagementPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [q, setQuery] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<InternalUserInput>();
  const [saving, setSaving] = useState(false);
  const load = useCallback(
    (signal: AbortSignal) => getAdminUsers({ page, q, role: role || undefined }, signal),
    [page, q, role],
  );
  const { result, loading, error, refresh } = useAdminList(load);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft || saving) return;
    setSaving(true);
    try {
      await createInternalUser(draft);
      setDraft(undefined);
      setPage(1);
      refresh();
      toast.success('Đã tạo tài khoản nội bộ.');
    } catch (err) {
      toast.error(err, 'Không thể tạo tài khoản.');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(user: AdminUser) {
    if (saving || (user.isActive && !window.confirm(`Khóa tài khoản ${user.email}?`))) return;
    setSaving(true);
    try {
      await setUserActive(user.id, !user.isActive);
      refresh();
      toast.success(user.isActive ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
    } catch (err) {
      toast.error(err, 'Không thể cập nhật tài khoản.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-3xl">Quản lý người dùng</h1>
          <button className="rounded bg-stone-900 px-4 py-2 text-white" onClick={() => setDraft(emptyUser)}>
            Tạo tài khoản nội bộ
          </button>
        </div>
        {draft && (
          <form onSubmit={submit} className="grid gap-3 rounded border border-stone-300 bg-white p-4 sm:grid-cols-2">
            <label>Họ tên<input required minLength={2} maxLength={120} className="block w-full rounded border p-2" value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} /></label>
            <label>Email<input required type="email" maxLength={150} className="block w-full rounded border p-2" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
            <label>Mật khẩu<input required type="password" autoComplete="new-password" minLength={8} maxLength={72} className="block w-full rounded border p-2" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} /></label>
            <label>Vai trò<select className="block w-full rounded border p-2" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value === 'admin' ? 'admin' : 'sales' })}>
              <option value="sales">Sales</option><option value="admin">Admin</option>
            </select></label>
            <div className="flex gap-3 sm:col-span-2">
              <button disabled={saving} className="rounded bg-stone-900 px-4 py-2 text-white disabled:opacity-50">Lưu tài khoản</button>
              <button disabled={saving} type="button" onClick={() => setDraft(undefined)} className="rounded border px-4 py-2">Hủy</button>
            </div>
          </form>
        )}
        <form className="flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(search.trim()); }}>
          <input aria-label="Tìm theo email hoặc họ tên" placeholder="Email hoặc họ tên" maxLength={200} className="rounded border p-2" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select aria-label="Lọc vai trò" className="rounded border p-2" value={role} onChange={(e) => { setRole(e.target.value as UserRole | ''); setPage(1); }}>
            <option value="">Mọi vai trò</option><option value="admin">Admin</option><option value="sales">Sales</option><option value="customer">Customer</option>
          </select>
          <button className="rounded border border-stone-400 px-4 py-2">Tìm kiếm</button>
        </form>
        {loading && <p role="status">Đang tải tài khoản…</p>}
        {error && <p role="alert">{error} <button className="underline" onClick={refresh}>Thử lại</button></p>}
        {!loading && !error && result && (
          result.data.length === 0 ? <p>Không tìm thấy tài khoản.</p> : (
            <>
              <div className="overflow-x-auto rounded border border-stone-300 bg-white">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="bg-stone-100"><tr>
                    {['ID', 'Tài khoản', 'Vai trò', 'Hạng', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map((label) => <th key={label} scope="col" className="p-3">{label}</th>)}
                  </tr></thead>
                  <tbody>{result.data.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="p-3">{user.id}</td>
                      <td className="break-all p-3"><strong>{user.fullName}</strong><br />{user.email}</td>
                      <td className="p-3">{user.role}</td>
                      <td className="p-3">{user.tierName ?? '—'}</td>
                      <td className="p-3">{user.isActive ? 'Hoạt động' : 'Đã khóa'}</td>
                      <td className="p-3">{formatDate(user.createdAt)}</td>
                      <td className="p-3">{(user.role !== 'admin' || !user.isActive) && (
                        <button disabled={saving} className="underline disabled:opacity-50" onClick={() => void toggle(user)}>
                          {user.isActive ? 'Khóa' : 'Mở khóa'}
                        </button>
                      )}</td>
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
