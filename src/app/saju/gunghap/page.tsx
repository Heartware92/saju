import { Suspense } from 'react';
import Layout from '@/components/Layout';
import GunghapPage from '@/pages/GunghapPage';

export default function Gunghap() {
  return (
    <Layout>
      {/* GunghapPage 내부 useSearchParams (보관함 ?recordId 처리) — SSG 빌드용 Suspense 래퍼 */}
      <Suspense fallback={<div className="min-h-screen" />}>
        <GunghapPage />
      </Suspense>
    </Layout>
  );
}
