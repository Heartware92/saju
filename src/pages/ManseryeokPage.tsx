'use client';

/**
 * 대표 프로필 기반 상세 만세력 페이지
 * - 홈의 간단 만세력에서 "만세력 보기" 버튼으로 진입
 * - 정통사주 결과 페이지의 사주원국~세운 블록(사주관계·오행십성·신강신약·대운수)을 그대로 노출
 * - AI 해석(기본/상세 풀이) 은 정통사주 페이지에서만 제공
 */

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import { computeSajuFromProfile } from '../utils/profileSaju';
import SajuReport from '../components/saju/SajuReport';
import styles from './SajuResultPage.module.css';

export default function ManseryeokPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const { profiles, fetchProfiles, hydrated, loading: profilesLoading, lastFetchedAt } = useProfileStore();

  useEffect(() => {
    if (user) fetchProfiles();
  }, [user, fetchProfiles]);

  const primary = useMemo(
    () => profiles.find((p) => p.is_primary) ?? null,
    [profiles],
  );

  const saju = useMemo(() => {
    if (!primary) return null;
    return computeSajuFromProfile(primary);
  }, [primary]);

  if (!primary) {
    const profileStoreReady = hydrated && lastFetchedAt !== null && !profilesLoading;
    if (!profileStoreReady) {
      return <div className={styles.loading}>로딩 중...</div>;
    }
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            ← 뒤로
          </button>
        </div>
        <div className={styles.section} style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h2>대표 프로필이 없어요</h2>
          <p style={{ margin: '16px 0 24px', color: 'var(--text-secondary)' }}>
            만세력을 보려면 먼저 생년월일시를 등록해주세요.
          </p>
          <Link href="/saju/input" className={styles.backBtn} style={{ margin: '0 auto', textDecoration: 'none' }}>
            프로필 등록하기
          </Link>
        </div>
      </div>
    );
  }

  if (!saju) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          ← 뒤로
        </button>
        <div className={styles.headerCenter}>
          <h1>만세력</h1>
          <p className={styles.dateInfo}>
            {primary.name} · {saju.solarDate} (양력) | {saju.lunarDateSimple} (음력)
          </p>
        </div>
      </div>

      {/* 시간 미상 안내 배너 */}
      {saju.hourUnknown && (
        <div className={styles.unknownHourBanner}>
          <strong>시간 미상 · 삼주추명(三柱推命)</strong>
          <p>
            출생 시간 미상으로 시주(時柱)는 제외되었습니다. 연·월·일주 기반으로
            분석됩니다.
          </p>
        </div>
      )}

      <div className={styles.content}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <SajuReport result={saju} defaultExpanded />
        </motion.div>
      </div>
    </div>
  );
}
