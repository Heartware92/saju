/**
 * Protected Route - 로그인 필요한 페이지 보호
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useUserStore();
  const location = useLocation();

  // 로딩 중일 때는 스피너 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않았으면 로그인 페이지로 리다이렉트
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * Guest Route - 로그인 시 접근 불가 (로그인/회원가입 페이지용)
 */
interface GuestRouteProps {
  children: React.ReactNode;
}

export const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { user, loading } = useUserStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 이미 로그인했으면 홈으로 리다이렉트
  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
