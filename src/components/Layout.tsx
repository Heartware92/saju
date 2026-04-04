'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUserStore } from '../store/useUserStore';
import { Button } from './ui/Button';
import { CreditDisplay, SunIcon, MoonIcon } from './ui/CreditDisplay';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: '홈', icon: 'home' },
  { path: '/saju', label: '사주', icon: 'pillars' },
  { path: '/tarot', label: '타로', icon: 'card' },
  { path: '/credit', label: '크레딧', icon: 'credit' },
  { path: '/mypage', label: '마이페이지', icon: 'user' },
];

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? 'var(--cta-primary)' : 'var(--text-tertiary)';
  const size = 22;

  switch (name) {
    case 'home':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9,22 9,12 15,12 15,22" />
        </svg>
      );
    case 'pillars':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
          <line x1="5" y1="4" x2="5" y2="20" />
          <line x1="10" y1="4" x2="10" y2="20" />
          <line x1="15" y1="4" x2="15" y2="20" />
          <line x1="20" y1="4" x2="20" y2="20" />
          {active && <circle cx="5" cy="4" r="1.5" fill={color} />}
          {active && <circle cx="10" cy="4" r="1.5" fill={color} />}
          {active && <circle cx="15" cy="4" r="1.5" fill={color} />}
          {active && <circle cx="20" cy="4" r="1.5" fill={color} />}
        </svg>
      );
    case 'card':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <circle cx="12" cy="12" r="3" fill={active ? color : 'none'} />
        </svg>
      );
    case 'credit':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="10" r="4" fill={active ? '#FFD700' : 'none'} stroke={active ? '#FFD700' : color} strokeWidth="1.5" />
          <path d="M19 14.79A7 7 0 1011.21 7 5.5 5.5 0 0019 14.79z" fill={active ? '#A5B4FC' : 'none'} stroke={active ? '#A5B4FC' : color} strokeWidth="1.5" />
        </svg>
      );
    case 'user':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useUserStore();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path) ?? false;
  };

  return (
    <div className="min-h-screen flex flex-col bg-space-deep">
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 hidden md:block glass-strong border-b border-[var(--border-subtle)]">
        <div className="w-full mx-auto px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-xl font-bold bg-gradient-to-r from-cta to-purple-400 bg-clip-text text-transparent">
                천문사주
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.slice(0, 3).map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`
                    px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium
                    ${isActive(item.path)
                      ? 'bg-[rgba(124,92,252,0.15)] text-cta'
                      : 'text-text-secondary hover:text-text-primary hover:bg-space-elevated'
                    }
                  `}
                >
                  <NavIcon name={item.icon} active={isActive(item.path)} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <CreditDisplay sunBalance={3} moonBalance={12} compact onClick={() => router.push('/credit')} />
                  <Button variant="ghost" size="sm" onClick={() => router.push('/mypage')}>
                    마이페이지
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    로그아웃
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                    로그인
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => router.push('/signup')}>
                    시작하기
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - bottom padding for mobile tab bar */}
      <main className="flex-1 w-full pb-safe md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass-strong border-t border-[var(--border-subtle)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[56px]
                  ${active ? 'text-cta' : 'text-text-tertiary'}
                `}
              >
                <div className="relative">
                  <NavIcon name={item.icon} active={active} />
                  {active && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cta shadow-[0_0_6px_var(--cta-primary)]" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer - desktop only */}
      <footer className="hidden md:block border-t border-[var(--border-subtle)] bg-space-void">
        <div className="w-full mx-auto px-6 lg:px-8 max-w-7xl py-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-text-secondary">
              &copy; 2026 천문사주 - 우주의 기운을 드립니다
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-text-tertiary">
              <Link href="/terms" className="hover:text-text-secondary transition-colors">이용약관</Link>
              <span>·</span>
              <Link href="/privacy" className="hover:text-text-secondary transition-colors">개인정보처리방침</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
