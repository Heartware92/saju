/**
 * 메인 레이아웃 컴포넌트 (Tailwind CSS 적용)
 * Header에 크레딧 잔액 & 로그인/로그아웃 버튼 추가
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUserStore } from '../store/useUserStore';
import { CreditBalance } from '../features/credit/components/CreditBalance';
import { Button } from './ui/Button';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useUserStore();

  const navItems = [
    { path: '/', label: '홈', icon: '🏠' },
    { path: '/saju', label: '사주풀이', icon: '📜' },
    { path: '/tarot', label: '타로', icon: '🎴' },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/');
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
          <div className="flex items-center justify-between h-24">
            {/* Logo - 텍스트만 */}
            <Link
              href="/"
              className="flex items-center gap-2 hover:scale-105 transition-transform duration-200"
            >
              <span
                className="text-2xl font-black text-primary"
                style={{
                  fontFamily: 'var(--font-serif)',
                  textShadow: '0 2px 4px rgba(139, 69, 19, 0.15)',
                  fontSize: '2rem'
                }}
              >
                사주풀이
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`
                    px-4 py-2 rounded-lg
                    transition-all duration-200
                    flex items-center gap-2
                    font-bold
                    ${
                      pathname === item.path
                        ? 'bg-primary text-white shadow-md'
                        : 'text-text-secondary hover:bg-secondary/80 hover:text-primary'
                    }
                  `}
                  style={pathname === item.path ? {
                    boxShadow: '0 2px 8px rgba(139, 69, 19, 0.3)'
                  } : {}}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-bold text-lg">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* 크레딧 잔액 - 곳간 */}
                  <CreditBalance showAddButton size="sm" />

                  {/* 마이페이지 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/mypage')}
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
                  {/* 로그인 - 심플한 텍스트 버튼 */}
                  <button
                    onClick={() => router.push('/login')}
                    style={{
                      padding: '0.65rem 1.25rem',
                      fontSize: '1.05rem',
                      fontWeight: '600',
                      color: '#8B4513',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'var(--font-serif, inherit)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(139, 69, 19, 0.08)';
                      e.currentTarget.style.color = '#654321';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#8B4513';
                    }}
                  >
                    로그인
                  </button>

                  {/* 회원가입 - 자연스러운 강조 버튼 */}
                  <button
                    onClick={() => router.push('/signup')}
                    style={{
                      padding: '0.65rem 1.5rem',
                      fontSize: '1.05rem',
                      fontWeight: '700',
                      color: '#8B4513',
                      background: 'linear-gradient(135deg, rgba(232, 212, 184, 0.6) 0%, rgba(222, 197, 165, 0.8) 100%)',
                      border: '1px solid rgba(139, 69, 19, 0.2)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      boxShadow: '0 1px 3px rgba(139, 69, 19, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                      fontFamily: 'var(--font-serif, inherit)',
                      backdropFilter: 'blur(4px)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #8B4513 0%, #654321 100%)';
                      e.currentTarget.style.color = '#FFFBF5';
                      e.currentTarget.style.borderColor = '#8B4513';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 69, 19, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(232, 212, 184, 0.6) 0%, rgba(222, 197, 165, 0.8) 100%)';
                      e.currentTarget.style.color = '#8B4513';
                      e.currentTarget.style.borderColor = 'rgba(139, 69, 19, 0.2)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(139, 69, 19, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
                      e.currentTarget.style.transform = 'translateY(0)';
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
          <nav className="flex items-center justify-around py-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg
                  transition-all duration-200
                  ${
                    pathname === item.path
                      ? 'text-primary scale-110'
                      : 'text-text-secondary hover:text-primary'
                  }
                `}
                style={pathname === item.path ? {
                  textShadow: '0 1px 3px rgba(139, 69, 19, 0.3)'
                } : {}}
              >
                <span className="text-3xl drop-shadow-sm">{item.icon}</span>
                <span className="text-base font-bold">{item.label}</span>
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
              <Link href="/terms" className="hover:text-primary">
                이용약관
              </Link>
              <span>·</span>
              <Link href="/privacy" className="hover:text-primary">
                개인정보처리방침
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
