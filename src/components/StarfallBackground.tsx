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

/* 별마다 각기 다른 이동 벡터(tx, ty) + 꼬리 각도(angle) — 전부 같은 대각선이 아닌
   40°~70° 범위의 다양한 기울기로 떨어지도록.
   angle(deg) = atan2(ty, tx) * 180/π — 꼬리 기울기가 실제 이동 방향과 정확히 일치
   (transform-origin 이 머리이므로 +각도면 꼬리가 반대방향으로 뻗음) */
const SHOOTING_STARS = [
  // 가파른 낙하 (~65°)
  { top: '-18%', left: '-15%', delay: '0s',    duration: '1.8s', tx: '420px', ty: '900px',  angle: '65deg' },
  { top: '-22%', left: '-5%',  delay: '1.1s',  duration: '2.0s', tx: '380px', ty: '950px',  angle: '68deg' },
  { top: '-15%', left: '-22%', delay: '2.3s',  duration: '1.7s', tx: '400px', ty: '880px',  angle: '66deg' },

  // 중간 각도 (~55°)
  { top: '-12%', left: '-10%', delay: '0.5s',  duration: '1.6s', tx: '600px', ty: '860px',  angle: '55deg' },
  { top: '-20%', left: '-18%', delay: '1.8s',  duration: '1.9s', tx: '550px', ty: '820px',  angle: '56deg' },
  { top: '-8%',  left: '-25%', delay: '3.0s',  duration: '2.1s', tx: '640px', ty: '900px',  angle: '54deg' },

  // 완만한 낙하 (~45°)
  { top: '-10%', left: '-3%',  delay: '0.9s',  duration: '1.5s', tx: '700px', ty: '700px',  angle: '45deg' },
  { top: '-14%', left: '-20%', delay: '2.6s',  duration: '1.8s', tx: '720px', ty: '720px',  angle: '45deg' },
  { top: '-16%', left: '-8%',  delay: '3.8s',  duration: '1.6s', tx: '680px', ty: '660px',  angle: '44deg' },

  // 매우 완만 (~40°)
  { top: '-6%',  left: '-12%', delay: '1.4s',  duration: '1.7s', tx: '780px', ty: '620px',  angle: '38deg' },
  { top: '-11%', left: '-6%',  delay: '3.2s',  duration: '1.9s', tx: '760px', ty: '640px',  angle: '40deg' },

  // 가장 가파름 (~72°) 거의 수직 낙하에 가까운 별
  { top: '-25%', left: '-2%',  delay: '2.0s',  duration: '2.2s', tx: '320px', ty: '980px',  angle: '72deg' },
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
