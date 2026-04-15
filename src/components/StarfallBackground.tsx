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

/* 9:16 프레임(≈430×764) 중앙(≈215,382) 을 관통하는 궤적.
   motion 은 translate(560px, 980px) → 기울기 1.75.
   중심을 지나려면 시작점이 (215 - t·560, 382 - t·980) 상에 놓여야 하며,
   프레임 바깥 좌상단에서 출발하도록 top/left 를 음수로 둠.
   궤적에 약간씩 편차를 줘 전부 같은 대각선에 놓이지 않도록 흩뿌림. */
const SHOOTING_STARS = [
  { top: '-15%', left: '-20%', delay: '0s',    duration: '1.8s' },
  { top: '-12%', left: '-5%',  delay: '0.9s',  duration: '1.6s' },
  { top: '-20%', left: '-15%', delay: '1.6s',  duration: '2.0s' },
  { top: '-8%',  left: '-28%', delay: '2.4s',  duration: '2.2s' },
  { top: '-18%', left: '0%',   delay: '3.1s',  duration: '1.5s' },
  { top: '-10%', left: '-10%', delay: '3.9s',  duration: '1.8s' },
  { top: '-22%', left: '-3%',  delay: '4.7s',  duration: '1.7s' },
  { top: '-14%', left: '-18%', delay: '5.5s',  duration: '2.0s' },
  { top: '-16%', left: '-8%',  delay: '6.3s',  duration: '1.4s' },
  { top: '-25%', left: '-22%', delay: '7.2s',  duration: '2.1s' },
  { top: '-11%', left: '-12%', delay: '8.0s',  duration: '1.6s' },
  { top: '-19%', left: '5%',   delay: '8.9s',  duration: '1.9s' },
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
