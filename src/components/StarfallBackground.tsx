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
  // 1) 가파른 (~70°) — 상단 중앙 근처에서 아래로 길게
  { startX: '0%',   startY: '-25%', tx: '100%', ty: '150%', angle: '70deg', delay: '0s',   duration: '7.0s' },
  // 2) 중간 가파름 (~64°) — 좌상단에서 중앙 가르며 우하단으로
  { startX: '-10%', startY: '-20%', tx: '120%', ty: '140%', angle: '64deg', delay: '8s',   duration: '7.5s' },
  // 3) 중간 (~59°) — 좌측에서 대각선 길게
  { startX: '-20%', startY: '-15%', tx: '140%', ty: '130%', angle: '59deg', delay: '16s',  duration: '7.2s' },
  // 4) 완만 (~53°) — 좌측 멀리에서 넓게 가로지름
  { startX: '-30%', startY: '-10%', tx: '160%', ty: '120%', angle: '53deg', delay: '24s',  duration: '8.0s' },
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
