import { Suspense } from 'react';
import Layout from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import TarotPage from '@/pages/TarotPage';

export default function Tarot() {
  return (
    <Layout>
      <ProtectedRoute>
        {/* TarotPage 내부 useSearchParams (보관함 ?recordId 처리) — SSG 빌드용 Suspense 래퍼 */}
        <Suspense fallback={<div className="min-h-screen" />}>
          <TarotPage />
        </Suspense>
      </ProtectedRoute>
    </Layout>
  );
}
