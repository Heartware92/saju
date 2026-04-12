import { Suspense } from 'react';
import AuthCallbackView from '@/pages/AuthCallbackPage';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-cta border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AuthCallbackRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthCallbackView />
    </Suspense>
  );
}
