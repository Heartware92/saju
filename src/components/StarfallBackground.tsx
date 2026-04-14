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

/* 상단 우측(-30%~-15%, left 55%~105%) 에서 출발 → 좌하단 바깥으로 대각 낙하
   좌측으로 520px 이동하므로 시작 left 는 우측에 치우치도록 배치
   각 별똥별이 서로 다른 궤적을 그려 화면 전체(글자/카드 뒤)를 가로지름 */
const SHOOTING_STARS = [
  { top: '-22%', left: '95%',  delay: '0s',    duration: '3.8s' },
  { top: '-28%', left: '70%',  delay: '1.4s',  duration: '4.2s' },
  { top: '-16%', left: '85%',  delay: '2.1s',  duration: '3.4s' },
  { top: '-35%', left: '110%', delay: '3.2s',  duration: '4.6s' },
  { top: '-18%', left: '60%',  delay: '4.0s',  duration: '4.0s' },
  { top: '-24%', left: '100%', delay: '5.3s',  duration: '3.6s' },
  { top: '-20%', left: '75%',  delay: '6.6s',  duration: '4.4s' },
  { top: '-30%', left: '55%',  delay: '7.8s',  duration: '3.8s' },
  { top: '-15%', left: '90%',  delay: '9.1s',  duration: '3.5s' },
  { top: '-25%', left: '105%', delay: '10.4s', duration: '4.2s' },
  { top: '-32%', left: '65%',  delay: '11.7s', duration: '4.0s' },
  { top: '-19%', left: '80%',  delay: '13.0s', duration: '3.7s' },
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
