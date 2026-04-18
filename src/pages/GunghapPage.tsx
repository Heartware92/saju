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
  generateSomGunghapPrompt,
  generateSpouseGunghapPrompt,
  generateExRelationGunghapPrompt,
  generateBusinessGunghapPrompt,
  generateSecretCrushGunghapPrompt,
  generateSoulmateGunghapPrompt,
  generateRivalGunghapPrompt,
  generateMentorGunghapPrompt,
  injectRoleContext,
  type GunghapCategory,
} from '../constants/prompts';
import { sanitizeAIOutput } from '../services/fortuneService';
import Link from 'next/link';

// ──────────────────────────────────────────────
// 카테고리 그룹 정의
// ──────────────────────────────────────────────
type CategoryItem = {
  id: GunghapCategory;
  label: string;
  desc: string;
  icon: string;
  accent: string;
};

type CategoryGroup = {
  groupLabel: string;
  groupColor: string;
  items: CategoryItem[];
};

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    groupLabel: '연애',
    groupColor: 'text-rose-400',
    items: [
      { id: 'secret_crush', label: '짝사랑', desc: '혼자만 마음이 있는 상대', icon: '✦', accent: 'from-rose-600/30 to-pink-500/15' },
      { id: 'som', label: '썸남·썸녀', desc: '아직 고백 전, 설레는 감정', icon: '♡', accent: 'from-rose-500/25 to-pink-400/15' },
      { id: 'lover', label: '연인', desc: '사귀는 남자친구·여자친구', icon: '♡', accent: 'from-pink-500/25 to-rose-400/15' },
      { id: 'spouse', label: '배우자', desc: '함께 사는 남편·아내', icon: '◎', accent: 'from-rose-400/25 to-amber-400/15' },
      { id: 'ex_lover', label: 'X여친·X남친', desc: '헤어진 연인', icon: '◇', accent: 'from-slate-500/25 to-rose-500/15' },
      { id: 'ex_spouse', label: 'X남편·X아내', desc: '이혼한 배우자', icon: '◇', accent: 'from-slate-500/25 to-violet-500/15' },
    ],
  },
  {
    groupLabel: '특별한 인연',
    groupColor: 'text-violet-400',
    items: [
      { id: 'soulmate', label: '소울메이트', desc: '설명 못하는 특별한 연결감', icon: '◉', accent: 'from-violet-500/30 to-indigo-400/15' },
      { id: 'rival', label: '라이벌', desc: '경쟁하며 서로 자극하는 관계', icon: '▲', accent: 'from-orange-500/25 to-amber-400/15' },
      { id: 'mentor', label: '멘토·멘티', desc: '성장과 배움의 파트너십', icon: '◆', accent: 'from-teal-500/25 to-emerald-400/15' },
    ],
  },
  {
    groupLabel: '인간관계',
    groupColor: 'text-blue-400',
    items: [
      { id: 'friend', label: '친구', desc: '가까운 벗, 오랜 친구', icon: '★', accent: 'from-amber-500/25 to-yellow-400/15' },
      { id: 'parent_child', label: '부모와 자녀', desc: '세대를 잇는 혈연 관계', icon: '▲', accent: 'from-teal-500/25 to-emerald-400/15' },
      { id: 'sibling', label: '형제·자매', desc: '같은 뿌리의 형제자매', icon: '▲', accent: 'from-green-500/25 to-teal-400/15' },
      { id: 'work', label: '직장 동료', desc: '함께 일하는 동료·상사', icon: '▲', accent: 'from-blue-500/25 to-indigo-400/15' },
      { id: 'business', label: '사업 파트너', desc: '공동 창업·사업 파트너', icon: '◆', accent: 'from-indigo-500/25 to-blue-400/15' },
    ],
  },
  {
    groupLabel: '재미로 보기',
    groupColor: 'text-amber-400',
    items: [
      { id: 'idol_fan', label: '아이돌과 팬', desc: '스타와 팬의 사주 인연', icon: '★', accent: 'from-yellow-500/25 to-amber-400/15' },
      { id: 'pet', label: '나와 반려동물', desc: '나와 반려묘·강아지', icon: '◆', accent: 'from-amber-500/25 to-orange-400/15' },
      { id: 'custom', label: '직접 입력', desc: '원하는 관계를 직접 입력', icon: '✎', accent: 'from-purple-500/25 to-violet-400/15' },
    ],
  },
];

const ALL_CATEGORIES = CATEGORY_GROUPS.flatMap(g => g.items);

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

type Step = 'category' | 'role' | 'input' | 'result';

const STEP_LABELS: Record<Step, string> = {
  category: '관계 선택',
  role: '역할 입력',
  input: '상대 정보',
  result: '결과',
};

// ──────────────────────────────────────────────
// GPT 호출
// ──────────────────────────────────────────────
async function callGunghapGPT(prompt: string): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens: 900, systemPrompt: SYSTEM_PROMPT }),
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

  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<GunghapCategory>('lover');
  const [customLabel, setCustomLabel] = useState('');
  const [myRole, setMyRole] = useState('');
  const [otherRole, setOtherRole] = useState('');
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
  const selectedCat = ALL_CATEGORIES.find(c => c.id === category)!;
  const isOtherValid = other.name.trim() && other.birth_date && other.gender;

  const getCategoryDisplayLabel = () => {
    if (category === 'custom' && customLabel.trim()) return customLabel.trim();
    return selectedCat?.label ?? '';
  };

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
        case 'secret_crush':
          prompt = generateSecretCrushGunghapPrompt(myResult, otherResult, myName, otherName);
          break;
        case 'som':
          prompt = generateSomGunghapPrompt(myResult, otherResult, myName, otherName);
          break;
        case 'lover':
          prompt = generateLoverGunghapPrompt(myResult, otherResult, myName, otherName);
          break;
        case 'spouse':
          prompt = generateSpouseGunghapPrompt(myResult, otherResult, myName, otherName);
          break;
        case 'ex_lover':
          prompt = generateExRelationGunghapPrompt(myResult, otherResult, myName, otherName, 'X여친·X남친');
          break;
        case 'ex_spouse':
          prompt = generateExRelationGunghapPrompt(myResult, otherResult, myName, otherName, 'X남편·X아내');
          break;
        case 'soulmate':
          prompt = generateSoulmateGunghapPrompt(myResult, otherResult, myName, otherName);
          break;
        case 'rival':
          prompt = generateRivalGunghapPrompt(myResult, otherResult, myName, otherName);
          break;
        case 'friend':
          prompt = generateFriendGunghapPrompt(myResult, otherResult, myName, otherName);
          break;
        case 'mentor':
          prompt = generateMentorGunghapPrompt(myResult, otherResult, myName, otherName);
          break;
        case 'parent_child':
          prompt = generateFamilyGunghapPrompt(myResult, otherResult, myName, otherName, '부모-자녀');
          break;
        case 'sibling':
          prompt = generateFamilyGunghapPrompt(myResult, otherResult, myName, otherName, '형제자매');
          break;
        case 'work':
          prompt = generateWorkGunghapPrompt(myResult, otherResult, myName, otherName);
          break;
        case 'business':
          prompt = generateBusinessGunghapPrompt(myResult, otherResult, myName, otherName);
          break;
        default:
          prompt = generateGeneralGunghapPrompt(
            myResult, otherResult, myName, otherName,
            getCategoryDisplayLabel()
          );
      }

      // 역할 컨텍스트 주입
      prompt = injectRoleContext(prompt, myName, myRole, otherName, otherRole);

      const text = await callGunghapGPT(prompt);
      const cleaned = text
        .replace(/^\[(?:secret_crush|som|lover|spouse|ex|soulmate|rival|friend|mentor|family|work|business|general)_gunghap\]\s*/m, '')
        .trim();
      setResult(cleaned);
      setStep('result');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('category');
    setResult('');
    setError('');
    setOther(defaultOther);
    setMyRole('');
    setOtherRole('');
    setCustomLabel('');
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

  const stepOrder: Step[] = ['category', 'role', 'input', 'result'];
  const stepIdx = stepOrder.indexOf(step);

  return (
    <div className="min-h-screen pb-24">
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
        <div className="flex items-center gap-1.5">
          {stepOrder.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 flex-1">
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                  ${step === s ? 'bg-cta text-white scale-110' : i < stepIdx ? 'bg-cta/50 text-white' : 'bg-white/10 text-text-tertiary'}`}>
                  {i + 1}
                </div>
                <span className={`text-[9px] font-medium whitespace-nowrap transition-colors
                  ${step === s ? 'text-cta' : i < stepIdx ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                  {STEP_LABELS[s]}
                </span>
              </div>
              {i < stepOrder.length - 1 && (
                <div className={`flex-1 h-px transition-colors ${i < stepIdx ? 'bg-cta/40' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: 관계 유형 선택 ── */}
        {step === 'category' && (
          <motion.div key="category" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-5 space-y-5">
            {CATEGORY_GROUPS.map(group => (
              <div key={group.groupLabel}>
                <p className={`text-[11px] font-bold mb-2.5 uppercase tracking-wider ${group.groupColor}`}>
                  {group.groupLabel}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all text-left
                        bg-gradient-to-br ${cat.accent}
                        ${category === cat.id ? 'border-cta/70 ring-1 ring-cta/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]' : 'border-[var(--border-subtle)] hover:border-white/25'}`}
                    >
                      <span className="text-lg leading-tight mt-0.5 w-5 text-center flex-shrink-0">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-text-primary leading-tight">{cat.label}</p>
                        <p className="text-[10px] text-text-secondary mt-0.5 leading-tight">{cat.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* 직접 입력 커스텀 라벨 */}
            <AnimatePresence>
              {category === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <input
                    type="text"
                    value={customLabel}
                    onChange={e => setCustomLabel(e.target.value)}
                    placeholder="관계를 직접 입력 (예: 전생의 연인, 인터넷 친구)"
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-text-primary text-[14px] placeholder-text-tertiary focus:border-cta/50 focus:outline-none transition"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setStep('role')}
              disabled={category === 'custom' && !customLabel.trim()}
              className="w-full py-3.5 rounded-2xl bg-cta text-white font-bold text-[15px] active:scale-[0.98] transition-all disabled:opacity-40"
            >
              다음 — 역할 입력
            </button>
          </motion.div>
        )}

        {/* ── STEP 2: 역할 입력 ── */}
        {step === 'role' && (
          <motion.div key="role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-5">

            {/* 선택된 관계 배지 */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 bg-gradient-to-r ${selectedCat.accent} border border-white/15`}>
              <span className="text-sm">{selectedCat.icon}</span>
              <span className="text-[13px] font-semibold text-text-primary">{getCategoryDisplayLabel()}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] space-y-4">
              <div>
                <p className="text-[13px] font-bold text-text-primary mb-0.5">
                  각자의 역할을 입력해주세요
                </p>
                <p className="text-[11px] text-text-tertiary">선택사항 · 입력할수록 분석이 더 개인화됩니다</p>
              </div>

              {/* 내 역할 */}
              <div>
                <label className="text-[11px] font-medium text-text-tertiary mb-1.5 block">
                  {selectedProfile?.name}의 역할
                </label>
                <input
                  type="text"
                  value={myRole}
                  onChange={e => setMyRole(e.target.value)}
                  placeholder="예: 남자친구, 엄마, 팬, 직속 상사"
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary text-[14px] placeholder-text-tertiary focus:border-cta/50 focus:outline-none transition"
                />
              </div>

              {/* 상대 역할 */}
              <div>
                <label className="text-[11px] font-medium text-text-tertiary mb-1.5 block">
                  상대방의 역할
                </label>
                <input
                  type="text"
                  value={otherRole}
                  onChange={e => setOtherRole(e.target.value)}
                  placeholder="예: 여자친구, 딸, 아이돌, 팀장"
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary text-[14px] placeholder-text-tertiary focus:border-cta/50 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setStep('category')}
                className="px-5 py-3.5 rounded-2xl border border-white/15 text-text-secondary font-medium text-[14px] active:scale-[0.98] transition-all"
              >
                이전
              </button>
              <button
                onClick={() => setStep('input')}
                className="flex-1 py-3.5 rounded-2xl bg-cta text-white font-bold text-[15px] active:scale-[0.98] transition-all"
              >
                {myRole.trim() || otherRole.trim() ? '역할 입력 완료' : '건너뛰기'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: 상대방 정보 입력 ── */}
        {step === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-5">

            {/* 내 프로필 선택 */}
            {profiles.length > 1 && (
              <div className="mb-4">
                <p className="text-[11px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">내 프로필</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {profiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setMyProfileId(p.id)}
                      className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-[13px] font-medium border transition-all
                        ${selectedProfile?.id === p.id ? 'bg-cta/20 border-cta/50 text-cta' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 내 정보 요약 */}
            {selectedProfile && (
              <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${selectedCat.accent} flex items-center justify-center text-sm border border-white/15 flex-shrink-0`}>
                  {selectedCat.icon}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-text-primary">{selectedProfile.name}</p>
                  <p className="text-[11px] text-text-secondary">{selectedProfile.birth_date} · {selectedProfile.gender === 'male' ? '남' : '여'}</p>
                </div>
                {(myRole.trim() || otherRole.trim()) && (
                  <div className="ml-auto text-[10px] text-text-tertiary text-right">
                    {myRole.trim() && <div>내 역할: {myRole}</div>}
                    {otherRole.trim() && <div>상대 역할: {otherRole}</div>}
                  </div>
                )}
              </div>
            )}

            {/* 상대방 입력 */}
            <div className="p-4 rounded-2xl bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] space-y-4">
              <p className="text-[13px] font-bold text-text-primary">상대방 정보</p>

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

              <div>
                <label className="text-[11px] font-medium text-text-tertiary mb-1.5 block">생년월일</label>
                <input
                  type="date"
                  value={other.birth_date}
                  onChange={e => setOther(o => ({ ...o, birth_date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary text-[14px] focus:border-cta/50 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-text-tertiary mb-1.5 block">
                  출생시간 <span className="text-text-tertiary/60">(모르면 비워두세요)</span>
                </label>
                <input
                  type="time"
                  value={other.birth_time}
                  onChange={e => setOther(o => ({ ...o, birth_time: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary text-[14px] focus:border-cta/50 focus:outline-none transition"
                />
              </div>

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
                onClick={() => setStep('role')}
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

        {/* ── STEP 4: 결과 ── */}
        {step === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-5">

            {/* 결과 헤더 */}
            <div className={`p-4 rounded-2xl mb-4 bg-gradient-to-br ${selectedCat.accent} border border-white/15`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedCat.icon}</span>
                <div className="flex-1">
                  <p className="text-[11px] text-text-tertiary uppercase tracking-wider">{getCategoryDisplayLabel()} 궁합</p>
                  <p className="text-[16px] font-bold text-text-primary mt-0.5">
                    {selectedProfile?.name} · {other.name}
                  </p>
                  {(myRole.trim() || otherRole.trim()) && (
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      {myRole.trim() && `${selectedProfile?.name}: ${myRole}`}
                      {myRole.trim() && otherRole.trim() && ' / '}
                      {otherRole.trim() && `${other.name}: ${otherRole}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 결과 본문 */}
            <div className="p-5 rounded-2xl bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
              <div className="text-[14px] text-text-primary leading-[1.85] whitespace-pre-wrap">
                {result}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2 mt-5">
              <button
                onClick={reset}
                className="flex-1 py-3.5 rounded-2xl border border-white/15 text-text-secondary font-medium text-[14px] active:scale-[0.98] transition-all"
              >
                처음으로
              </button>
              <button
                onClick={() => { setStep('input'); setResult(''); setError(''); }}
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
