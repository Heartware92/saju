import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ConsultationChatPage from '@/pages/ConsultationChatPage';

export default function SangdamsoChatRoute() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="min-h-screen" />}>
        <ConsultationChatPage />
      </Suspense>
    </ProtectedRoute>
  );
}
