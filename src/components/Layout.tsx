/**
 * 메인 레이아웃 컴포넌트 (Tailwind CSS 적용)
 * Header에 크레딧 잔액 & 로그인/로그아웃 버튼 추가
 */

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { CreditBalance } from '../features/credit/components/CreditBalance';
import { Button } from './ui/Button';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUserStore();

  const navItems = [
    { path: '/', label: '홈', icon: '🏠' },
    { path: '/saju', label: '사주풀이', icon: '📜' },
    { path: '/tarot', label: '타로', icon: '🎴' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Header - 한지 느낌 */}
      <header
        className="sticky top-0 z-40 border-b-2 border-primary/20 shadow-hanji"
        style={{
          background: 'linear-gradient(to bottom, #FFFBF5 0%, #F5E6D3 100%)',
          boxShadow: '0 2px 8px rgba(139, 69, 19, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
        }}
      >
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            {/* Logo - 전통 느낌 강화 */}
            <Link
              to="/"
              className="flex items-center gap-2 hover:scale-105 transition-transform duration-200"
            >
              <span className="text-3xl drop-shadow-md">☯</span>
              <span
                className="text-xl font-black text-primary hidden sm:block"
                style={{
                  fontFamily: 'var(--font-serif)',
                  textShadow: '0 2px 4px rgba(139, 69, 19, 0.15)'
                }}
              >
                사주풀이
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    px-4 py-2 rounded-lg
                    transition-all duration-200
                    flex items-center gap-2
                    font-bold
                    ${
                      location.pathname === item.path
                        ? 'bg-primary text-white shadow-md'
                        : 'text-text-secondary hover:bg-secondary/80 hover:text-primary'
                    }
                  `}
                  style={location.pathname === item.path ? {
                    boxShadow: '0 2px 8px rgba(139, 69, 19, 0.3)'
                  } : {}}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-bold">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* 크레딧 잔액 - 곳간 */}
                  <CreditBalance showAddButton size="sm" />

                  {/* 마이페이지 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/mypage')}
                    className="hidden lg:flex font-bold"
                  >
                    내 정보
                  </Button>

                  {/* 로그아웃 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="hidden sm:flex font-bold"
                  >
                    나가기
                  </Button>
                </>
              ) : (
                <>
                  {/* 엽전 충전 (로그인 전) */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/credit')}
                    className="hidden sm:flex font-bold text-accent hover:text-accent-dark"
                  >
                    🪙 충전
                  </Button>

                  {/* 로그인 */}
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 text-sm font-bold text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                  >
                    로그인
                  </button>

                  {/* 회원가입 */}
                  <button
                    onClick={() => navigate('/signup')}
                    className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-dark transition-all shadow-md hover:shadow-lg"
                    style={{
                      boxShadow: '0 2px 8px rgba(139, 69, 19, 0.3)'
                    }}
                  >
                    회원가입
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className="md:hidden border-t-2 border-primary/15"
          style={{
            background: 'linear-gradient(to bottom, rgba(245, 230, 211, 0.8), rgba(245, 230, 211, 0.95))',
            boxShadow: '0 -2px 8px rgba(139, 69, 19, 0.1)'
          }}
        >
          <nav className="flex items-center justify-around py-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg
                  transition-all duration-200
                  ${
                    location.pathname === item.path
                      ? 'text-primary scale-110'
                      : 'text-text-secondary hover:text-primary'
                  }
                `}
                style={location.pathname === item.path ? {
                  textShadow: '0 1px 3px rgba(139, 69, 19, 0.3)'
                } : {}}
              >
                <span className="text-2xl drop-shadow-sm">{item.icon}</span>
                <span className="text-xs font-bold">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary/5 border-t border-border mt-auto">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-6">
          <div className="text-center space-y-2">
            <p className="text-text font-medium">
              © 2024 사주풀이 - 정통 사주명리학 & 타로
            </p>
            <p className="text-sm text-text-secondary">
              동양과 서양의 지혜를 담다 🪙
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-text-secondary mt-4">
              <Link to="/terms" className="hover:text-primary">
                이용약관
              </Link>
              <span>·</span>
              <Link to="/privacy" className="hover:text-primary">
                개인정보처리방침
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
