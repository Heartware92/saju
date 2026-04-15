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
/* 4개 별 모두 궤적의 중간점이 프레임 중앙(~50%,50%) 근처를 스치도록 설계
   — 기준 프레임 ~400×720 기준으로 midpoint = start + vector/2 ≈ (200px, 360px)
   — 각 별마다 다른 각도로 낙하 (50°~73° 범위)
   — 속도는 3.5~5s 로 여유있게 (이전 1.5~2.2s 에서 대폭 완화) */
const SHOOTING_STARS = [
  // 1) 가파른 낙하 — 프레임 상단에서 시작해 중앙을 가르며 하단으로
  { top: '-18%', left: '10%',  delay: '0s',   duration: '4.2s', tx: '300px', ty: '980px', angle: '73deg' },
  // 2) 중간 기울기 — 왼쪽 위에서 대각선으로 중앙 통과
  { top: '-14%', left: '-6%',  delay: '3.0s', duration: '4.6s', tx: '480px', ty: '920px', angle: '63deg' },
  // 3) 완만 — 더 왼쪽에서 출발, 길게 스치듯
  { top: '-10%', left: '-18%', delay: '6.5s', duration: '4.4s', tx: '580px', ty: '820px', angle: '55deg' },
  // 4) 매우 완만 — 거의 수평에 가까운 유성
  { top: '-6%',  left: '-22%', delay: '9.5s', duration: '5.0s', tx: '620px', ty: '740px', angle: '50deg' },
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
