import { Suspense } from 'react';
import Layout from '@/components/Layout';
import TaekilPage from '@/pages/TaekilPage';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-cta border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function TaekilFortune() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <TaekilPage />
      </Suspense>
    </Layout>
  );
}
