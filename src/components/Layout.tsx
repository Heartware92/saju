'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CreditDisplay } from './ui/CreditDisplay';
import { useCreditStore } from '../store/useCreditStore';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: '홈', icon: 'home' },
  { path: '/saju', label: '사주', icon: 'pillars' },
  { path: '/tarot', label: '타로', icon: 'card' },
  { path: '/archive', label: '보관함', icon: 'archive' },
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
    case 'archive':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="5" rx="1" />
          <path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8" />
          <path d="M10 12h4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { sunBalance, moonBalance } = useCreditStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path) ?? false;
  };

  return (
    <div className="app-shell">
      <div className="app-container">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-50 flex items-center justify-between h-12 px-4 bg-[rgba(26,18,48,0.88)] backdrop-blur-xl border-b border-[var(--border-subtle)]">
          {/* Left: 이천점 로고 (홈 링크) — 추후 아이콘으로 교체 */}
          <Link
            href="/"
            className="h-8 flex items-center px-1 rounded-lg transition-opacity hover:opacity-80 active:opacity-60"
            aria-label="이천점 홈으로"
          >
            <span
              className="text-base font-bold bg-gradient-to-r from-[var(--cta-primary)] to-[var(--cta-secondary)] bg-clip-text text-transparent"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              이천점
            </span>
          </Link>

          {/* Center: Credit Display */}
          <CreditDisplay
            sunBalance={sunBalance}
            moonBalance={moonBalance}
            compact
            onClick={() => router.push('/credit')}
          />

          {/* Right: Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-space-elevated transition-colors"
            aria-label="메뉴 열기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </header>

        {/* Side Menu Overlay */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setMenuOpen(false)}
            />
            <div className="fixed top-0 right-0 w-[280px] h-full z-50 bg-space-deep border-l border-[var(--border-subtle)] p-6 shadow-2xl animate-slideInRight">
              <div className="flex items-center justify-between mb-8">
                <span className="text-lg font-bold bg-gradient-to-r from-cta to-purple-400 bg-clip-text text-transparent">
                  이천점
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col gap-2">
                {[
                  { path: '/credit', label: '크레딧 충전', icon: '💎' },
                  { path: '/mypage', label: '내 정보', icon: '👤' },
                  { path: '/archive', label: '보관함', icon: '📦' },
                ].map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-space-surface transition-colors"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="absolute bottom-8 left-6 right-6">
                <p className="text-xs text-text-tertiary text-center">
                  &copy; 2026 이천점
                </p>
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 w-full overflow-y-auto pb-[calc(64px+env(safe-area-inset-bottom,0px))]">
          {children}
        </main>

        {/* Bottom Tab Bar - always visible */}
        <nav className="app-tab-bar">
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
      </div>
    </div>
  );
}
