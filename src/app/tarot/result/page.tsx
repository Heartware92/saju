import { Suspense } from 'react';
import Layout from '@/components/Layout';
import TarotResultPage from '@/pages/TarotResultPage';

export default function TarotResult() {
  return (
    <Layout>
      {/* useSearchParams 사용 — Next 16 SSG 빌드용 Suspense 래퍼 */}
      <Suspense fallback={<div className="min-h-screen" />}>
        <TarotResultPage />
      </Suspense>
    </Layout>
  );
}
