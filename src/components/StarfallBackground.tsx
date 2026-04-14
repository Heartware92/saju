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

/* 상단 외부(-30%~-15%) 에서 출발 → 우하단 바깥으로 대각 낙하
   left 는 화면 좌/중앙 분포 — 각 별똥별이 서로 다른 궤적을 그리도록 */
const SHOOTING_STARS = [
  { top: '-20%', left: '10%', delay: '0s',    duration: '3.4s' },
  { top: '-25%', left: '35%', delay: '4.6s',  duration: '4.0s' },
  { top: '-15%', left: '55%', delay: '2.1s',  duration: '3.6s' },
  { top: '-30%', left: '-5%', delay: '7.8s',  duration: '4.4s' },
  { top: '-18%', left: '75%', delay: '10.2s', duration: '3.8s' },
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
        >
          <span className={styles.trail} />
        </span>
      ))}
    </div>
  );
}
