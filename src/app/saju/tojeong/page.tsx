import { Suspense } from 'react';
import Layout from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import TojeongResultPage from '@/pages/TojeongResultPage';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-cta border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function TojeongRoute() {
  return (
    <Layout>
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <TojeongResultPage />
        </Suspense>
      </ProtectedRoute>
    </Layout>
  );
}
