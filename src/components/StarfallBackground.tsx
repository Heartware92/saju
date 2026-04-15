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

/* 모든 좌표/벡터는 컨테이너(9:16 프레임) 기준 % — 뷰포트 높이에 관계없이 동일한 궤적
   midpoint = startX + tx/2 = 50%, startY + ty/2 = 50% → 모든 별이 정확히 중앙 관통
   9:16 비율 기준 angle = atan2(ty * 16/9, tx) 로 꼬리 기울기 계산 */
const SHOOTING_STARS = [
  // 1) 중간 (~55°) — 좌상단에서 대각선으로 중앙 통과
  { startX: '-15%', startY: '-2.5%', tx: '130%', ty: '105%', angle: '55deg', delay: '0s',   duration: '10.0s' },
  // 2) 완만 (~50°) — 조금 더 수평에 가깝게
  { startX: '-25%', startY: '0%',    tx: '150%', ty: '100%', angle: '50deg', delay: '10s',  duration: '10.5s' },
  // 3) 더 완만 (~46°) — 좌측 멀리에서 길게 가로지름
  { startX: '-35%', startY: '0%',    tx: '170%', ty: '100%', angle: '46deg', delay: '20s',  duration: '11.0s' },
  // 4) 수평에 가까움 (~42°) — 가장 넓은 스윕
  { startX: '-50%', startY: '0%',    tx: '200%', ty: '100%', angle: '42deg', delay: '30s',  duration: '11.5s' },
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
            animationDelay: s.delay,
            animationDuration: s.duration,
            ['--start-x' as string]: s.startX,
            ['--start-y' as string]: s.startY,
            ['--tx' as string]: s.tx,
            ['--ty' as string]: s.ty,
            ['--angle' as string]: s.angle,
          } as React.CSSProperties}
        >
          <span className={styles.trail} />
        </span>
      ))}
    </div>
  );
}
