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
/* 4개 별 모두 프레임(~400×720) 좌측 대각선 바깥에서 시작해 우측 대각선 바깥으로
   빠져나가도록 — midpoint = start + vector/2 ≈ 프레임 중앙(200,360) 통과
   각도는 48°~68° 범위로 다양, 모든 별이 프레임의 대부분 면을 가로지름 */
const SHOOTING_STARS = [
  // 1) 가파른 — 상단 멀리에서 출발해 중앙을 가르며 하단으로
  { top: '-32%', left: '-12%', delay: '0s',    duration: '7.0s', tx: '500px',  ty: '1180px', angle: '68deg' },
  // 2) 중간 가파름 — 좌상단에서 대각선 길게
  { top: '-25%', left: '-20%', delay: '8s',    duration: '7.5s', tx: '580px',  ty: '1080px', angle: '62deg' },
  // 3) 중간 — 좌측에서 대각선으로 중앙 통과해 우측 아래까지
  { top: '-15%', left: '-28%', delay: '16s',   duration: '7.2s', tx: '660px',  ty: '940px',  angle: '55deg' },
  // 4) 완만 — 거의 수평에 가까운 긴 대각선, 프레임을 넓게 가로지름
  { top: '-8%',  left: '-40%', delay: '24s',   duration: '8.0s', tx: '760px',  ty: '840px',  angle: '48deg' },
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
