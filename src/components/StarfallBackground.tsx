'use client';

/**
 * 별 떨어지는 전역 배경
 * - 듀스크(dusk) 그라데이션 + 은은한 별자리 + 대각선으로 스쳐지나가는 별똥별
 * - 모든 페이지 뒤에 고정 위치로 깔림 (pointer-events: none)
 * - prefers-reduced-motion 존중
 *
 * 별똥별 위치/딜레이는 셔플된 고정값 — 서버·클라이언트 불일치 방지용 deterministic
 */
import styles from './StarfallBackground.module.css';

const SHOOTING_STARS = [
  { top: '8%',  left: '-10%', delay: '0s',    duration: '3.2s' },
  { top: '22%', left: '-15%', delay: '5.8s',  duration: '3.8s' },
  { top: '45%', left: '-8%',  delay: '2.4s',  duration: '4.2s' },
  { top: '63%', left: '-12%', delay: '8.1s',  duration: '3.5s' },
  { top: '78%', left: '-6%',  delay: '11.3s', duration: '4.6s' },
];

export default function StarfallBackground() {
  return (
    <div className={styles.root} aria-hidden="true">
      {/* 듀스크 그라데이션 */}
      <div className={styles.gradient} />

      {/* 작은 별빛 레이어 (트윙클) */}
      <div className={`${styles.stars} ${styles.starsBack}`} />
      <div className={`${styles.stars} ${styles.starsFront}`} />

      {/* 은은한 성운(구름) */}
      <div className={styles.nebula} />

      {/* 별똥별 */}
      {SHOOTING_STARS.map((s, i) => (
        <span
          key={i}
          className={styles.shootingStar}
          style={{
            top: s.top,
            left: s.left,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </div>
  );
}
