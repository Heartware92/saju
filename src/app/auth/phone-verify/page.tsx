import { Suspense } from 'react';
import PhoneVerifyPage from '@/pages/PhoneVerifyPage';

export default function PhoneVerifyRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-cta border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PhoneVerifyPage />
    </Suspense>
  );
}
