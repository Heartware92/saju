import { Suspense } from 'react';
import Layout from '@/components/Layout';
import SajuInputPage from '@/pages/SajuInputPage';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function SajuInput() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <SajuInputPage />
      </Suspense>
    </Layout>
  );
}
