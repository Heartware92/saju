'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import { computeSajuFromProfile } from '../utils/profileSaju';
import type { BirthProfile } from '../types/credit';
import {
  SYSTEM_PROMPT,
  generateLoverGunghapPrompt,
  generateFriendGunghapPrompt,
  generateFamilyGunghapPrompt,
  generateWorkGunghapPrompt,
  generateGeneralGunghapPrompt,
  type GunghapCategory,
} from '../constants/prompts';
import { sanitizeAIOutput } from '../services/fortuneService';
import Link from 'next/link';

// ──────────────────────────────────────────────
// 카테고리 정의
// ──────────────────────────────────────────────
const CATEGORIES: {
  id: GunghapCategory;
  label: string;
  desc: string;
  color: string;
  icon: string;
}[] = [
  { id: 'lover',   label: '연인·배우자', desc: '사랑의 케미와 장기 궁합', color: 'from-rose-500/25 to-pink-500/15',   icon: '♡' },
  { id: 'friend',  label: '친구',        desc: '우정의 오행 에너지',       color: 'from-amber-500/25 to-yellow-500/15', icon: '★' },
  { id: 'family',  label: '가족',        desc: '혈연 관계의 사주 흐름',    color: 'from-teal-500/25 to-emerald-500/15', icon: '◎' },
  { id: 'work',    label: '직장동료',    desc: '업무 시너지와 갈등 예방',   color: 'from-blue-500/25 to-indigo-500/15',  icon: '▲' },
  { id: 'general', label: '기타 관계',  desc: '모든 인간관계 궁합',        color: 'from-purple-500/25 to-violet-500/15', icon: '◆' },
];

const FAMILY_RELATIONS = ['부모-자녀', '형제자매', '조부모-손자녀', '고부·장서'];

// ──────────────────────────────────────────────
// 상대방 입력 폼 상태
// ──────────────────────────────────────────────
interface OtherInput {
  name: string;
  birth_date: string;
  birth_time: string;
  gender: 'male' | 'female';
  calendar_type: 'solar' | 'lunar';
}

const defaultOther: OtherInput = {
  name: '',
  birth_date: '',
  birth_time: '',
  gender: 'female',
  calendar_type: 'solar',
};

// ──────────────────────────────────────────────
// GPT 호출
// ──────────────────────────────────────────────
async function callGunghapGPT(prompt: string): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens: 800, systemPrompt: SYSTEM_PROMPT }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '분석 실패');
  return sanitizeAIOutput(data.content);
}

// ──────────────────────────────────────────────
// 컴포넌트
// ──────────────────────────────────────────────
export default function GunghapPage() {
  const { user } = useUserStore();
  const { profiles } = useProfileStore();

  const [step, setStep] = useState<'category' | 'input' | 'result'>('category');
  const [category, setCategory] = useState<GunghapCategory>('lover');
  const [familyRelation, setFamilyRelation] = useState(FAMILY_RELATIONS[0]);
  const [myProfileId, setMyProfileId] = useState<string>('');
  const [other, setOther] = useState<OtherInput>(defaultOther);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const primaryProfile = useMemo(() => profiles.find(p => p.is_primary) ?? profiles[0] ?? null, [profiles]);
  const selectedProfile = useMemo(
    () => profiles.find(p => p.id === myProfileId) ?? primaryProfile,
    [profiles, myProfileId, primaryProfile],
  );
  const selectedCat = CATEGORIES.find(c => c.id === category)!;

  const isOtherValid = other.name.trim() && other.birth_date && other.gender;

  const handleAnalyze = async () => {
    if (!selectedProfile || !isOtherValid) return;
    setLoading(true);
    setError('');
    try {
      const myResult = computeSajuFromProfile(selectedProfile);
      if (!myResult) throw new Error('내 사주 계산 실패');

      const otherProfile: BirthProfile = {
        id: 'other',
        user_id: '',
        name: other.name.trim(),
        birth_date: other.birth_date,
        birth_time: other.birth_time || undefined,
        birth_place: 'seoul',
        gender: other.gender,
        calendar_type: other.calendar_type,
        is_primary: false,
        created_at: '',
        updated_at: '',
      };
      const otherResult = computeSajuFromProfile(otherProfile);
      if (!otherResult) throw new Error('상대방 사주 계산 실패');

      const myName = selectedProfile.name;
      const otherName = other.name.trim();
      let prompt = '';

      switch (category) {
        case 'lover':
          prompt = generateLoverGunghapPrompt(myResult, otherResult, myName, otherName);
          break;
        case 'friend':
          prompt = generateFriendGunghapPrompt(myResult, otherResult, myName, otherName);
          break;
        case 'family':
          prompt = generateFamilyGunghapPrompt(myResult, otherResult, myName, otherName, familyRelation);
          break;
        case 'work':
          prompt = generateWorkGunghapPrompt(myResult, otherResult, myName, otherName);
          break;
        default:
          prompt = generateGeneralGunghapPrompt(myResult, otherResult, myName, otherName, selectedCat.label);
      }

      const text = await callGunghapGPT(prompt);
      // 마커 제거
      const cleaned = text.replace(/^\[(?:lover|friend|family|work|general)_gunghap\]\s*/m, '').trim();
      setResult(cleaned);
      setStep('result');
    } catch (e: any) {
      setError(e.message || '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('category');
    setResult('');
    setError('');
    setOther(defaultOther);
  };

  // 비로그인 처리
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary mb-4">궁합 분석은 로그인 후 이용 가능합니다.</p>
        <Link href="/login" className="text-cta font-semibold underline">로그인하기</Link>
      </div>
    );
  }

  if (!primaryProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary mb-4">내 프로필을 먼저 등록해야 궁합을 볼 수 있어요.</p>
        <Link href="/saju/input" className="text-cta font-semibold underline">프로필 등록</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* 헤더 */}
      <div className="px-5 pt-8 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-text-primary mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
            궁합 분석
          </h1>
          <p className="text-sm text-text-secondary">두 사람의 사주로 보는 인연의 흐름</p>
        </motion.div>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2">
          {(['category', 'input', 'result'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold
                ${step === s ? 'bg-cta text-white' : i < ['category','input','result'].indexOf(step) ? 'bg-cta/40 text-white' : 'bg-white/10 text-text-tertiary'}`}>
                {i + 1}
              </div>
              {i < 2 && <div className="flex-1 h-px bg-white/10" />}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: 카테고리 선택 ── */}
        {step === 'category' && (
          <motion.div key="category" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-5">
            <h2 className="text-[13px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">관계 유형 선택</h2>
            <div className="flex flex-col gap-2.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left
                    bg-gradient-to-br ${cat.color}
                    ${category === cat.id ? 'border-cta/60 ring-1 ring-cta/30' : 'border-[var(--border-subtle)] hover:border-white/20'}`}
                >
                  <span className="text-2xl w-8 text-center">{cat.icon}</span>
                  <div className="flex-1">
                    <p className="text-[15px] font-bold text-text-primary">{cat.label}</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">{cat.desc}</p>
                  </div>
                  {category === cat.id && (
                    <div className="w-5 h-5 rounded-full bg-cta flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2,6 5,9 10,3" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* 가족 서브관계 */}
            {category === 'family' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                <p className="text-[12px] font-medium text-text-secondary mb-2">가족 관계 세부 선택</p>
                <div className="grid grid-cols-2 gap-2">
                  {FAMILY_RELATIONS.map(rel => (
                    <button
                      key={rel}
                      onClick={() => setFamilyRelation(rel)}
                      className={`py-2.5 px-3 rounded-xl text-[13px] font-medium border transition-all
                        ${familyRelation === rel ? 'bg-cta/20 border-cta/50 text-cta' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <button
              onClick={() => setStep('input')}
              className="w-full mt-6 py-3.5 rounded-2xl bg-cta text-white font-bold text-[15px] active:scale-[0.98] transition-all"
            >
              다음 — 상대방 정보 입력
            </button>
          </motion.div>
        )}

        {/* ── STEP 2: 상대방 정보 입력 ── */}
        {step === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-5">

            {/* 내 프로필 선택 */}
            {profiles.length > 1 && (
              <div className="mb-5">
                <p className="text-[12px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">내 프로필</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {profiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setMyProfileId(p.id)}
                      className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-[13px] font-medium border transition-all
                        ${(selectedProfile?.id === p.id) ? 'bg-cta/20 border-cta/50 text-cta' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 선택된 내 정보 요약 */}
            {selectedProfile && (
              <div className="mb-5 p-3.5 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[11px] text-text-tertiary mb-1">나</p>
                <p className="text-[14px] font-bold text-text-primary">{selectedProfile.name}</p>
                <p className="text-[12px] text-text-secondary">{selectedProfile.birth_date} · {selectedProfile.gender === 'male' ? '남' : '여'}</p>
              </div>
            )}

            {/* 상대방 입력 */}
            <div className="p-4 rounded-2xl bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] space-y-4">
              <p className="text-[13px] font-bold text-text-primary">상대방 정보</p>

              {/* 이름 */}
              <div>
                <label className="text-[11px] font-medium text-text-tertiary mb-1.5 block">이름</label>
                <input
                  type="text"
                  value={other.name}
                  onChange={e => setOther(o => ({ ...o, name: e.target.value }))}
                  placeholder="상대방 이름"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary text-[14px] placeholder-text-tertiary focus:border-cta/50 focus:outline-none transition"
                />
              </div>

              {/* 생년월일 */}
              <div>
                <label className="text-[11px] font-medium text-text-tertiary mb-1.5 block">생년월일</label>
                <input
                  type="date"
                  value={other.birth_date}
                  onChange={e => setOther(o => ({ ...o, birth_date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary text-[14px] focus:border-cta/50 focus:outline-none transition"
                />
              </div>

              {/* 출생시간 (선택) */}
              <div>
                <label className="text-[11px] font-medium text-text-tertiary mb-1.5 block">
                  출생시간 <span className="text-text-tertiary">(모르면 비워두세요)</span>
                </label>
                <input
                  type="time"
                  value={other.birth_time}
                  onChange={e => setOther(o => ({ ...o, birth_time: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary text-[14px] focus:border-cta/50 focus:outline-none transition"
                />
              </div>

              {/* 성별 */}
              <div>
                <label className="text-[11px] font-medium text-text-tertiary mb-1.5 block">성별</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['male', 'female'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setOther(o => ({ ...o, gender: g }))}
                      className={`py-2.5 rounded-xl text-[13px] font-medium border transition-all
                        ${other.gender === g ? 'bg-cta/20 border-cta/50 text-cta' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
                    >
                      {g === 'male' ? '남성' : '여성'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 양력/음력 */}
              <div>
                <label className="text-[11px] font-medium text-text-tertiary mb-1.5 block">역법</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['solar', 'lunar'] as const).map(c => (
                    <button
                      key={c}
                      onClick={() => setOther(o => ({ ...o, calendar_type: c }))}
                      className={`py-2.5 rounded-xl text-[13px] font-medium border transition-all
                        ${other.calendar_type === c ? 'bg-cta/20 border-cta/50 text-cta' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
                    >
                      {c === 'solar' ? '양력' : '음력'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-[13px] text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setStep('category')}
                className="px-5 py-3.5 rounded-2xl border border-white/15 text-text-secondary font-medium text-[14px] active:scale-[0.98] transition-all"
              >
                이전
              </button>
              <button
                disabled={!isOtherValid || loading}
                onClick={handleAnalyze}
                className="flex-1 py-3.5 rounded-2xl bg-cta text-white font-bold text-[15px] active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    분석 중...
                  </span>
                ) : '궁합 분석하기'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: 결과 ── */}
        {step === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-5">

            {/* 결과 헤더 */}
            <div className={`p-4 rounded-2xl mb-4 bg-gradient-to-br ${selectedCat.color} border border-white/10`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedCat.icon}</span>
                <div>
                  <p className="text-[12px] text-text-tertiary">{selectedCat.label} 궁합</p>
                  <p className="text-[16px] font-bold text-text-primary">
                    {selectedProfile?.name} · {other.name}
                  </p>
                  {category === 'family' && (
                    <p className="text-[12px] text-text-secondary mt-0.5">{familyRelation}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 결과 본문 */}
            <div className="p-5 rounded-2xl bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
              <pre className="text-[14px] text-text-primary leading-relaxed whitespace-pre-wrap font-sans">
                {result}
              </pre>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2 mt-5">
              <button
                onClick={reset}
                className="flex-1 py-3.5 rounded-2xl border border-white/15 text-text-secondary font-medium text-[14px] active:scale-[0.98] transition-all"
              >
                다시 보기
              </button>
              <button
                onClick={() => { setStep('input'); setResult(''); }}
                className="flex-1 py-3.5 rounded-2xl bg-cta/20 border border-cta/40 text-cta font-bold text-[14px] active:scale-[0.98] transition-all"
              >
                다른 상대 분석
              </button>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
