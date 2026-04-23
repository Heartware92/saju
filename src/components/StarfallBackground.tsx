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
/* 2개 별이 동일 duration(30s)으로 정확히 15s 씩 엇갈려 번갈아 떨어지도록
   각 사이클 앞 70% 는 invisible 대기 → 실제 별똥별은 30s 중 ~8s 만 보임
   delay 음수 — keyframe 의 대기 구간(0~70%=21s)을 미리 소진시켜 페이지 진입 즉시 낙하 시작
   Star 1 은 진입 직후(~0.6s)에 등장, Star 2 는 15s 뒤 등장, 이후 15s 간격 반복 */
const SHOOTING_STARS = [
  // 1) 중간 기울기 (~55°) — 진입 즉시 낙하
  { startX: '-15%', startY: '-2.5%', tx: '130%', ty: '105%', angle: '55deg', delay: '-21s', duration: '30s' },
  // 2) 완만 (~42°) — 15s 뒤 낙하
  { startX: '-50%', startY: '0%',    tx: '200%', ty: '100%', angle: '42deg', delay: '-6s',  duration: '30s' },
];

export default function StarfallBackground() {
  return (
    <div className={styles.root} aria-hidden="true">
      {/* 듀스크 그라데이션 */}
      <div className={styles.gradient} />

      {/* 옅은 은하수 밴드 — 좌상 → 우하 대각 */}
      <div className={styles.milkyWay} />

      {/* 작은 별빛 레이어 (트윙클) */}
      <div className={`${styles.stars} ${styles.starsBack}`} />
      <div className={`${styles.stars} ${styles.starsFront}`} />

      {/* 은은한 성운(구름) */}
      <div className={styles.nebula} />

      {/* 한국 전통 구름 문양(구름무늬) — 화면 하단에 은은하게 */}
      <svg
        className={styles.traditionalCloud}
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 전통 구름무늬 스타일 — 둥근 소용돌이 세 덩어리 */}
        <path
          d="M 0 70
             C 20 50, 40 45, 55 55
             C 65 45, 80 42, 90 52
             C 100 42, 115 40, 125 50
             C 130 58, 128 68, 120 72
             C 135 72, 145 80, 140 90
             C 125 92, 115 85, 115 75
             C 105 85, 85 85, 80 72
             C 70 82, 50 80, 45 68
             C 30 78, 10 78, 0 70 Z"
          fill="currentColor"
          opacity="0.5"
        />
        <path
          d="M 160 75
             C 175 55, 195 52, 210 62
             C 220 52, 235 50, 245 60
             C 255 50, 270 48, 280 58
             C 285 66, 283 76, 275 80
             C 285 82, 292 90, 285 96
             C 272 96, 265 88, 265 80
             C 258 88, 240 88, 235 76
             C 225 84, 205 82, 200 72
             C 185 82, 168 82, 160 75 Z"
          fill="currentColor"
          opacity="0.4"
        />
        <path
          d="M 310 72
             C 325 54, 345 50, 358 60
             C 368 50, 383 48, 393 58
             C 398 65, 396 75, 390 78
             C 400 82, 400 90, 392 94
             C 380 94, 372 86, 372 76
             C 365 84, 348 84, 343 72
             C 330 80, 315 80, 310 72 Z"
          fill="currentColor"
          opacity="0.45"
        />
      </svg>

      {/* 달 — 우상단, 은은한 후광 */}
      <div className={styles.moon}>
        <div className={styles.moonGlow} />
        <div className={styles.moonBody} />
      </div>

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
