import { Suspense } from 'react';
import Layout from '@/components/Layout';
import SajuResultPage from '@/pages/SajuResultPage';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function SajuResult() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <SajuResultPage />
      </Suspense>
    </Layout>
  );
}
