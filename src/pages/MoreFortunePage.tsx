'use client';

/**
 * 더 많은 운세 — 공통 페이지 컴포넌트
 * 9개 카테고리를 단일 페이지에서 처리:
 *  1. 소개 카드(긴 설명)
 *  2. 대표 프로필 요약
 *  3. 풀이 보기 버튼 (달 크레딧 1 소모)
 *  4. 버튼 클릭 시 로딩 → 결과 표시
 *
 * 이름 풀이는 name 입력 폼이 추가로 노출됨.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import { useCreditStore } from '../store/useCreditStore';
import { computeSajuFromProfile } from '../utils/profileSaju';
import {
  MORE_FORTUNE_CONFIGS,
  MOON_COST_PER_FORTUNE,
  type MoreFortuneId,
} from '../constants/moreFortunes';
import {
  getLoveShort,
  getWealthShort,
  getCareerShort,
  getHealthShort,
  getStudyShort,
  getPeopleShort,
  getChildrenShort,
  getPersonalityShort,
  getNameFortune,
  getDreamInterpretation,
} from '../services/fortuneService';
import { analyzeKoreanName } from '../utils/nameEumRyeong';
import { AILoadingBar } from '../components/AILoadingBar';
import { DreamInputPanel } from '../components/dream/DreamInputPanel';
import styles from './SajuResultPage.module.css';

interface Props {
  /** 카테고리 id. /saju/more/[category] 동적 라우트에서 주입된다. */
  category?: MoreFortuneId;
}

const LOADING_MESSAGES: Record<MoreFortuneId, string[]> = {
  love:        ['일지 배우자궁을 살피는 중입니다', '재성·관성 배치를 읽는 중입니다', '올해 연애운 월별 흐름 분석 중입니다'],
  wealth:      ['재성·재고를 확인하는 중입니다', '식상 흐름으로 재물 구조 분석 중입니다', '올해 돈의 흐름을 짚는 중입니다'],
  career:      ['격국과 관성·식상을 분석 중입니다', '적합한 직군을 도출하는 중입니다', '올해 커리어 시기 살피는 중입니다'],
  health:      ['약한 오행과 취약 장부를 보는 중입니다', '충·형 구조를 확인하는 중입니다', '올해 주의할 달을 짚는 중입니다'],
  study:       ['인성·문창귀인 확인 중입니다', '식상으로 표현력 분석 중입니다', '유리한 시험 시기 찾는 중입니다'],
  people:      ['천을귀인과 인성을 살피는 중입니다', '비겁 배치로 관계 스타일 분석 중입니다', '올해 도움될 사람 유형 도출 중입니다'],
  children:    ['자녀성과 자녀궁을 확인 중입니다', '식상·관성 흐름 분석 중입니다', '출산 유리한 시기 짚는 중입니다'],
  personality: ['일주 60갑자 특성 확인 중입니다', '격국·신강신약 종합 중입니다', '간여지동과 신살 분석 중입니다'],
  name:        ['초성 오행을 계산 중입니다', '사주 용신과 이름 오행 비교 중입니다', '이름이 주는 기운을 분석 중입니다'],
  dream:       ['전통 꿈해몽 사전을 찾는 중입니다', '꿈속 상징과 사주 오행을 맞춰보는 중입니다', '올해 세운과 꿈의 연결점을 짚는 중입니다'],
};

export default function MoreFortunePage({ category }: Props) {
  // ── 모든 Hooks는 무조건 상단에 호출 (React Hooks 규칙) ──
  const router = useRouter();
  const { user } = useUserStore();
  const { profiles, fetchProfiles } = useProfileStore();
  const { moonBalance, consumeCredit, fetchBalance } = useCreditStore();

  const isValidCategory = !!category && (category in MORE_FORTUNE_CONFIGS);
  const cfg = isValidCategory ? MORE_FORTUNE_CONFIGS[category as MoreFortuneId] : null;

  const primary = useMemo(
    () => profiles.find((p) => p.is_primary) ?? profiles[0] ?? null,
    [profiles],
  );

  const saju = useMemo(() => {
    if (!primary) return null;
    return computeSajuFromProfile(primary);
  }, [primary]);

  // 이름 풀이 전용 state
  const [koreanName, setKoreanName] = useState('');
  const [hanjaName, setHanjaName] = useState('');

  // 꿈 해몽 전용 state — DreamInputPanel에서 onChange로 주입되는 합성 텍스트/유효성
  const [dreamText, setDreamText] = useState('');
  const [dreamValid, setDreamValid] = useState(false);

  // 결과 state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Next.js pages-router 자동 라우팅으로 category 없이 진입될 수 있음 → 홈으로 보냄
  useEffect(() => {
    if (!isValidCategory && typeof window !== 'undefined') {
      router.replace('/');
    }
  }, [isValidCategory, router]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchBalance();
    }
  }, [user, fetchProfiles, fetchBalance]);

  // 이름 풀이: 프로필의 이름을 기본값으로
  useEffect(() => {
    if (category === 'name' && primary && !koreanName) {
      setKoreanName(primary.name);
    }
  }, [category, primary, koreanName]);

  // 모든 Hooks 이후 guard: 유효하지 않은 카테고리면 렌더 중단
  if (!cfg) return null;

  const canSubmit = useMemo(() => {
    // 꿈 해몽은 사주 원국을 쓰지 않는다 — 프로필 없어도 DreamInputPanel 입력만으로 가능
    if (category === 'dream') return dreamValid;
    if (!saju) return false;
    if (category === 'name') {
      return koreanName.trim().length >= 1;
    }
    return true;
  }, [saju, category, koreanName, dreamValid]);

  const handleRead = async () => {
    // 꿈 해몽은 saju 없이도 실행 가능
    if (category !== 'dream' && !saju) return;
    if (!canSubmit || loading) return;

    if (moonBalance < MOON_COST_PER_FORTUNE) {
      setError('달 크레딧이 부족해요. 크레딧을 충전해주세요.');
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      type FortuneResp = { success: boolean; content?: string; error?: string };
      let resp: FortuneResp = { success: false, error: '알 수 없는 카테고리' };

      if (category === 'dream') {
        resp = await getDreamInterpretation(dreamText.trim());
      } else {
        // 여기서 saju는 이미 위 가드로 보장됨
        const s = saju!;
        switch (category) {
          case 'love':        resp = await getLoveShort(s); break;
          case 'wealth':      resp = await getWealthShort(s); break;
          case 'career':      resp = await getCareerShort(s); break;
          case 'health':      resp = await getHealthShort(s); break;
          case 'study':       resp = await getStudyShort(s); break;
          case 'people':      resp = await getPeopleShort(s); break;
          case 'children':    resp = await getChildrenShort(s); break;
          case 'personality': resp = await getPersonalityShort(s); break;
          case 'name': {
            const kor = analyzeKoreanName(koreanName);
            resp = await getNameFortune(s, {
              koreanName: koreanName.trim(),
              koreanInitialsElements: kor.elements,
              hanjaName: hanjaName.trim() || undefined,
              hanjaElements: undefined,
            });
            break;
          }
        }
      }

      if (!resp || !resp.success || !resp.content) {
        throw new Error(resp?.error || '풀이 생성에 실패했어요.');
      }

      // 응답 성공 후 크레딧 차감
      const consumed = await consumeCredit('moon', MOON_COST_PER_FORTUNE, `더많은운세:${cfg.title}`);
      if (!consumed) {
        console.error('크레딧 차감 실패 (응답은 이미 생성됨)');
      }

      setResult(resp!.content);
    } catch (e: any) {
      setError(e?.message || '오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  // 비로그인 가드
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary mb-4">{cfg.title} 풀이는 로그인 후 이용 가능해요.</p>
        <Link href="/login" className="text-cta font-semibold underline">로그인하기</Link>
      </div>
    );
  }

  // 꿈 해몽은 사주와 무관 — 프로필 없어도 진입 가능
  if (category !== 'dream' && !primary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary mb-4">{cfg.title}을 보려면 대표 프로필이 필요해요.</p>
        <Link href="/saju/input" className="text-cta font-semibold underline">프로필 등록</Link>
      </div>
    );
  }

  if (category !== 'dream' && !saju) {
    return <div className={styles.loading}>사주 계산 중...</div>;
  }

  // 로딩 풀스크린
  if (loading) {
    return (
      <AILoadingBar
        label={`${cfg.title} 분석 중`}
        minLabel="5초"
        maxLabel="20초"
        estimatedSeconds={12}
        messages={LOADING_MESSAGES[category as MoreFortuneId]}
        topContent={
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="text-[28px] mb-1 font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
              {cfg.title}
            </div>
            <div className="text-[14px] text-text-tertiary">{cfg.shortDesc}</div>
          </motion.div>
        }
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          ← 뒤로
        </button>
        <div className={styles.headerCenter}>
          <h1>{cfg.title}</h1>
          <p className={styles.dateInfo}>{primary.name} · {primary.birth_date}</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.content}
      >
        {/* 소개 카드 */}
        <div
          className={styles.section}
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.10), rgba(236,72,153,0.06))',
            border: '1px solid rgba(139,92,246,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ display: 'inline-block', width: 4, height: 22, borderRadius: 2, background: 'var(--cta-primary)' }} />
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
                MORE FORTUNE
              </p>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{cfg.title}</h2>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>
            {cfg.longDesc}
          </p>
        </div>

        {/* 꿈 해몽 전용 입력 — 선명/흐릿 두 모드 */}
        {category === 'dream' && (
          <div className={styles.section}>
            <h2 style={{ fontSize: 18, marginBottom: 14, fontWeight: 700 }}>꿈 내용 입력</h2>
            <DreamInputPanel
              onTextChange={setDreamText}
              onValidChange={setDreamValid}
            />
          </div>
        )}

        {/* 이름 풀이 전용 입력 */}
        {category === 'name' && (
          <div className={styles.section}>
            <h2 style={{ fontSize: 14 }}>이름 입력</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>
                  한글 이름 (필수)
                </label>
                <input
                  type="text"
                  value={koreanName}
                  onChange={(e) => setKoreanName(e.target.value)}
                  placeholder="예: 허진우"
                  maxLength={10}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    color: 'var(--text-primary)',
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>
                  한자 이름 (선택)
                </label>
                <input
                  type="text"
                  value={hanjaName}
                  onChange={(e) => setHanjaName(e.target.value)}
                  placeholder="예: 許珍雨 (몰라도 됩니다)"
                  maxLength={10}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    color: 'var(--text-primary)',
                    fontSize: 14,
                  }}
                />
                <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  한자를 모르시면 비워두세요. 한글만으로도 음령오행 분석 가능합니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 풀이 보기 버튼 */}
        <div className={styles.section} style={{ padding: 0, background: 'none', border: 'none' }}>
          <button
            onClick={handleRead}
            disabled={!canSubmit || loading || moonBalance < MOON_COST_PER_FORTUNE}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, var(--cta-primary), var(--cta-secondary, var(--cta-primary)))',
              color: 'white',
              border: 'none',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: (!canSubmit || loading || moonBalance < MOON_COST_PER_FORTUNE) ? 'not-allowed' : 'pointer',
              opacity: (!canSubmit || loading || moonBalance < MOON_COST_PER_FORTUNE) ? 0.5 : 1,
              boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {cfg.ctaButton} <span style={{ opacity: 0.85, fontSize: 13 }}>🌙 {MOON_COST_PER_FORTUNE}</span>
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 6 }}>
            보유 🌙 {moonBalance} · 1회 {MOON_COST_PER_FORTUNE}개 소모
          </p>
        </div>

        {/* 에러 */}
        {error && (
          <div
            className={styles.section}
            style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.35)',
            }}
          >
            <p style={{ fontSize: 13, color: '#F87171', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* 결과 */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.section}
            >
              <h2 style={{ fontSize: 17, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 4, height: 20, borderRadius: 2, background: 'var(--cta-primary)' }} />
                {cfg.title} 풀이
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  lineHeight: 1.85,
                  whiteSpace: 'pre-line',
                  margin: 0,
                }}
              >
                {result}
              </p>

              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    setResult(null);
                    setError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  다시 풀이 받기
                </button>
                <Link
                  href="/"
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--cta-primary)',
                    border: 'none',
                    borderRadius: 10,
                    color: 'white',
                    fontSize: 12,
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  홈으로
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
