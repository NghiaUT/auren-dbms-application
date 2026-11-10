import { useEffect, useState } from 'react';
import type { AdminPage } from '../../api/admin.api';
import { formatApiError } from '../../utils/formatApiError';

export function useAdminList<T>(load: (signal: AbortSignal) => Promise<AdminPage<T>>) {
  const [result, setResult] = useState<AdminPage<T>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    load(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setResult(data); })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(formatApiError(err, 'Không thể tải danh sách').message);
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [load, revision]);

  return { result, loading, error, refresh: () => setRevision((value) => value + 1) };
}
