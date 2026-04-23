import { Suspense } from 'react';
import { LoginPage } from '@/features/auth/LoginPage';

export default function Login() {
  // useSearchParams 는 Suspense 경계 필요 (App Router prerender 대응)
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
