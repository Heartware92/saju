import { Suspense } from 'react';
import AdminPage from '@/pages/AdminPage';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';

export const metadata = { title: '어드민 | 사주' };

export default function AdminRoute() {
  return (
    <AdminErrorBoundary>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-secondary">로딩 중…</div>}>
        <AdminPage />
      </Suspense>
    </AdminErrorBoundary>
  );
}
