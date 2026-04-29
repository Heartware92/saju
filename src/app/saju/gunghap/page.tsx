import { Suspense } from 'react';
import Layout from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import GunghapPage from '@/pages/GunghapPage';

export default function Gunghap() {
  return (
    <Layout>
      <ProtectedRoute>
        {/* GunghapPage 내부 useSearchParams (보관함 ?recordId 처리) — SSG 빌드용 Suspense 래퍼 */}
        <Suspense fallback={<div className="min-h-screen" />}>
          <GunghapPage />
        </Suspense>
      </ProtectedRoute>
    </Layout>
  );
}
