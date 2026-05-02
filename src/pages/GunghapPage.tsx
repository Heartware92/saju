'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import { useCreditStore } from '../store/useCreditStore';
import { useReportCacheStore, sajuKey, type ReportKind } from '../store/useReportCacheStore';
import { sajuDB } from '../services/supabase';
import { BackButton } from '../components/ui/BackButton';
import { SUN_COST_BIG, CHARGE_REASONS } from '../constants/creditCosts';
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
  generatePetGunghapPrompt,
  PET_SPECIES_VIBE,
  PET_PERSONALITY_OPTIONS,
  type PetSpecies,
  type PetInput,
  injectRoleContext,
  type GunghapCategory,
} from '../constants/prompts';
import { sanitizeAIOutput } from '../services/fortuneService';
import { archiveSaju, findRecentArchive } from '../services/archiveService';
import { RestoreReportModal } from '../components/RestoreReportModal';
import Link from 'next/link';
import { AILoadingBar } from '../components/AILoadingBar';
import { useLoadingGuard } from '../hooks/useLoadingGuard';

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

// 반려동물 입력 기본값
const defaultPet: PetInput = {
  name: '',
  species: 'dog',
  gender: 'unknown',
  personalityKeywords: [],
  birthDate: '',
  adoptionDate: '',
};

type Step = 'category' | 'role' | 'input' | 'result';

const STEP_LABELS: Record<Step, string> = {
  category: '관계 선택',
  role: '역할 입력',
  input: '상대 정보',
  result: '결과',
};

// ──────────────────────────────────────────────
// GPT 호출 (55초 타임아웃 + 빈 응답·잘림 방어)
// ──────────────────────────────────────────────
// 궁합 프롬프트별 본문 분량(2,000~2,600자, 8섹션이 가장 김)을 안전하게 수용:
// 한국어 1자 ≈ 1.5~2 토큰 → 2,600자 ≈ 4,000~5,200 토큰. 보수적으로 4,500.
async function callGunghapGPT(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55_000);
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, maxTokens: 4500, systemPrompt: SYSTEM_PROMPT }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '분석 실패');
    if (!data.content || typeof data.content !== 'string') {
      throw new Error('AI 응답이 비어 있습니다. 잠시 후 다시 시도해주세요.');
    }
    if (data.truncated === true) {
      console.warn('[Gunghap] truncated response — bump maxTokens', { len: data.content.length });
      throw new Error('응답이 길어서 일부 잘렸어요. 잠시 후 다시 시도해주세요.');
    }
    const sanitized = sanitizeAIOutput(data.content);
    // 궁합 본문은 최소 700자 이상이어야 정상 (가장 짧은 ex 카테고리 1,000자 기준의 70%)
    if (sanitized.length < 700) {
      console.warn('[Gunghap] too-short response — likely refusal/garbage', { len: sanitized.length, snippet: sanitized.slice(0, 80) });
      throw new Error('풀이 결과가 비정상적으로 짧아요. 잠시 후 다시 시도해주세요.');
    }
    return sanitized;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('응답이 너무 오래 걸려요. 잠시 후 다시 시도해주세요.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ──────────────────────────────────────────────
// 컴포넌트
// ──────────────────────────────────────────────
export default function GunghapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams?.get('recordId') ?? null;
  const isArchiveMode = !!recordId;
  const { user } = useUserStore();
  const { profiles } = useProfileStore();

  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<GunghapCategory>('lover');
  const [customLabel, setCustomLabel] = useState('');
  const [myRole, setMyRole] = useState('');
  const [otherRole, setOtherRole] = useState('');
  const [myProfileId, setMyProfileId] = useState<string>('');
  const [other, setOther] = useState<OtherInput>(defaultOther);
  const [pet, setPet] = useState<PetInput>(defaultPet);
  // 상대방 입력 방식 — 'profile'은 내 등록 프로필에서 선택, 'manual'은 직접 입력
  const [otherMode, setOtherMode] = useState<'profile' | 'manual'>('manual');
  const [otherProfileId, setOtherProfileId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  // ── 로딩 안전장치: 70초 초과 시 강제 해제 ──
  const [loadingTimedOut] = useLoadingGuard(loading, 70_000);
  useEffect(() => {
    if (loadingTimedOut) {
      setLoading(false);
      if (!result) setError('AI 응답이 너무 오래 걸려요. 새로고침 후 다시 시도해주세요.');
    }
  }, [loadingTimedOut, result]);

  const [cacheGate, setCacheGate] = useState<{ kind: ReportKind; key: string; restore: () => void } | null>(null);
  const handleUseCached = () => { cacheGate?.restore(); setCacheGate(null); };
  const handleRefetch = () => { setCacheGate(null); };

  const primaryProfile = useMemo(() => profiles.find(p => p.is_primary) ?? profiles[0] ?? null, [profiles]);
  const selectedProfile = useMemo(
    () => profiles.find(p => p.id === myProfileId) ?? primaryProfile,
    [profiles, myProfileId, primaryProfile],
  );
  const selectedCat = ALL_CATEGORIES.find(c => c.id === category)!;

  // 상대 후보 = 내 기준 프로필을 제외한 나머지 내 등록 프로필
  const otherProfileChoices = useMemo(
    () => profiles.filter(p => p.id !== selectedProfile?.id),
    [profiles, selectedProfile],
  );
  const selectedOtherProfile = useMemo(
    () => otherProfileChoices.find(p => p.id === otherProfileId) ?? null,
    [otherProfileChoices, otherProfileId],
  );

  // 선택 가능한 다른 프로필이 1개 이상 생기면 자동으로 'profile' 모드 전환
  // (사용자가 수동으로 manual을 고른 뒤엔 유지됨 — 아래 toggle 버튼만 반응)
  useEffect(() => {
    if (otherProfileChoices.length > 0 && otherMode === 'manual' && !other.name && !other.birth_date) {
      setOtherMode('profile');
    }
    if (otherProfileChoices.length === 0 && otherMode === 'profile') {
      setOtherMode('manual');
    }
    // 내 프로필이 변경되어 상대로 선택했던 프로필이 더 이상 후보에 없어졌으면 초기화
    if (otherProfileId && !otherProfileChoices.some(p => p.id === otherProfileId)) {
      setOtherProfileId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherProfileChoices.length, selectedProfile?.id]);

  const isPetCategory = category === 'pet';

  // 반려동물은 "역할" 입력이 의미 없으므로 role 단계 자동 스킵
  useEffect(() => {
    if (step === 'role' && isPetCategory) {
      setStep('input');
    }
  }, [step, isPetCategory]);

  // ── 보관함 재생 모드 — recordId 가 있으면 DB 에서 풀이 텍스트 복원, 바로 result step ──
  useEffect(() => {
    if (!recordId) return;
    let cancelled = false;
    sajuDB.getRecordById(recordId)
      .then((record) => {
        if (cancelled || !record) return;
        const content = record.interpretation_detailed ?? record.interpretation_basic ?? '';
        if (content) {
          setResult(content);
          setStep('result');
        } else {
          setError('보관된 풀이 본문이 없어요.');
        }
      })
      .catch((e) => {
        console.error('[archive replay] gunghap load failed', e);
        if (!cancelled) setError('보관된 풀이를 불러오지 못했어요.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [recordId]);

  // ── 보관함 DB 확인 — 이전에 본 풀이가 있으면 모달 표시 ──
  useEffect(() => {
    if (isArchiveMode || !primaryProfile) return;
    if (searchParams?.get('fresh') === '1') return;
    let cancelled = false;
    findRecentArchive({
      category: 'gunghap',
      birth_date: primaryProfile.birth_date,
      gender: primaryProfile.gender,
    }).then(found => {
      if (cancelled || !found) return;
      setCacheGate({
        kind: 'gunghap',
        key: '',
        restore: () => {
          const params = new URLSearchParams(window.location.search);
          params.set('recordId', found.id);
          router.replace(`${window.location.pathname}?${params.toString()}`);
        },
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [primaryProfile, isArchiveMode]);

  const otherDisplayName = isPetCategory
    ? pet.name.trim()
    : otherMode === 'profile'
      ? (selectedOtherProfile?.name ?? '')
      : other.name.trim();

  const isOtherValid = isPetCategory
    ? !!pet.name.trim()
    : otherMode === 'profile'
      ? !!selectedOtherProfile
      : !!(other.name.trim() && other.birth_date && other.gender);

  const getCategoryDisplayLabel = () => {
    if (category === 'custom' && customLabel.trim()) return customLabel.trim();
    return selectedCat?.label ?? '';
  };

  const handleAnalyze = async () => {
    if (!selectedProfile || !isOtherValid) return;
    setLoading(true);
    setError('');
    // catch 단계에서 negative cache 에 저장할 키. pet/normal 분기 어디서 실패했는지 추적.
    let activeCacheKey: string | null = null;
    try {
      const myResult = computeSajuFromProfile(selectedProfile);
      if (!myResult) throw new Error('내 사주 계산 실패');

      // ── 반려동물 전용 분기 (사주 없이 주인 사주 + 동물 상징 기운으로 해석) ──
      if (isPetCategory) {
        const petTrimmed: PetInput = {
          ...pet,
          name: pet.name.trim(),
          birthDate: pet.birthDate || undefined,
          adoptionDate: pet.adoptionDate || undefined,
        };
        const petCacheKey = [
          sajuKey(myResult),
          'pet',
          petTrimmed.species,
          petTrimmed.gender,
          petTrimmed.name,
          petTrimmed.personalityKeywords.slice().sort().join(','),
          petTrimmed.birthDate ?? '_',
          petTrimmed.adoptionDate ?? '_',
        ].join('|');
        const petCached = useReportCacheStore.getState().getReport<string>('gunghap', petCacheKey);
        if (petCached?.error) {
          setError(petCached.error);
          setLoading(false);
          return;
        }
        // 재진입 silent restore
        if (petCached?.data) {
          setResult(petCached.data);
          setStep('result');
          setLoading(false);
          return;
        }
        activeCacheKey = petCacheKey;
        const petPrompt = generatePetGunghapPrompt(myResult, selectedProfile.name, petTrimmed);
        const petText = await callGunghapGPT(petPrompt);
        const petCleaned = petText
          .replace(
            /^\s*\[?(?:pet|secret_crush|som|lover|spouse|ex|soulmate|rival|friend|mentor|family|parent_child|sibling|work|business|general)_gunghap\]?\s*\n?/i,
            '',
          )
          .trim();
        setResult(petCleaned);
        setStep('result');
        const cache = useReportCacheStore.getState();
        cache.setReport('gunghap', petCacheKey, petCleaned);
        if (!cache.isCharged('gunghap', petCacheKey)) {
          cache.markCharged('gunghap', petCacheKey);
          useCreditStore.getState()
            .chargeForContent('sun', SUN_COST_BIG, CHARGE_REASONS.gunghap)
            .catch(() => {});
        }
        // 보관함 저장 — 반려동물 분기. partner.birth_date 는 비어있어 메타로만 보존.
        archiveSaju({
          sourceBirth: {
            birth_date: selectedProfile.birth_date,
            birth_time: selectedProfile.birth_time ?? undefined,
            gender: selectedProfile.gender,
            calendar_type: selectedProfile.calendar_type,
          },
          category: 'gunghap',
          engineResult: {
            gunghapCategory: 'pet',
            pet: petTrimmed,
            myRole: myRole.trim(),
            otherRole: otherRole.trim(),
          } as unknown as Record<string, unknown>,
          interpretation: petCleaned,
          partner: {
            name: petTrimmed.name || '반려동물',
            birth_date: petTrimmed.birthDate ?? '',
          },
          creditType: 'sun',
          creditUsed: SUN_COST_BIG,
        }).catch(() => {});
        return;
      }

      // 상대 사주 계산 — 등록 프로필 선택 모드면 해당 프로필 그대로 사용
      const otherBase: BirthProfile = otherMode === 'profile' && selectedOtherProfile
        ? selectedOtherProfile
        : {
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
      const otherResult = computeSajuFromProfile(otherBase);
      if (!otherResult) throw new Error('상대방 사주 계산 실패');

      // 캐시 키 — 두 사주 + 카테고리 + 역할 + custom 라벨까지 포함해야 결과가 달라질 때 새로 호출
      const cacheKey = [
        sajuKey(myResult),
        sajuKey(otherResult),
        category,
        myRole || '_',
        otherRole || '_',
        category === 'custom' ? customLabel.trim() : '_',
      ].join('|');

      const cached = useReportCacheStore.getState().getReport<string>('gunghap', cacheKey);
      if (cached?.error) {
        setError(cached.error);
        setLoading(false);
        return;
      }
      // 재진입 silent restore
      if (cached?.data) {
        setResult(cached.data);
        setStep('result');
        setLoading(false);
        return;
      }
      activeCacheKey = cacheKey;

      const myName = selectedProfile.name;
      const otherName = otherBase.name;
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
      // 프롬프트 차원에서 제거했지만, 과거 패턴 잔재 방어용 — 대괄호 유무 관계없이 첫 줄의 xxx_gunghap 태그 소거
      const cleaned = text
        .replace(
          /^\s*\[?(?:secret_crush|som|lover|spouse|ex|soulmate|rival|friend|mentor|family|parent_child|sibling|work|business|general)_gunghap\]?\s*\n?/i,
          '',
        )
        .trim();
      setResult(cleaned);
      setStep('result');
      const cache = useReportCacheStore.getState();
      cache.setReport('gunghap', cacheKey, cleaned);
      if (!cache.isCharged('gunghap', cacheKey)) {
        cache.markCharged('gunghap', cacheKey);
        useCreditStore.getState()
          .chargeForContent('sun', SUN_COST_BIG, CHARGE_REASONS.gunghap)
          .catch(() => {});
      }
      // 보관함 저장 — 카테고리/역할/상대방 메타 포함. archiveService 가 sourceBirth 로 자동 프로필 매칭.
      archiveSaju({
        sourceBirth: {
          birth_date: selectedProfile.birth_date,
          birth_time: selectedProfile.birth_time ?? undefined,
          gender: selectedProfile.gender,
          calendar_type: selectedProfile.calendar_type,
        },
        category: 'gunghap',
        engineResult: {
          gunghapCategory: category,
          customLabel: category === 'custom' ? customLabel.trim() : undefined,
          myRole: myRole.trim(),
          otherRole: otherRole.trim(),
        } as unknown as Record<string, unknown>,
        interpretation: cleaned,
        partner: {
          name: otherName,
          birth_date: otherBase.birth_date,
        },
        creditType: 'sun',
        creditUsed: SUN_COST_BIG,
      }).catch(() => {});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '분석 중 오류가 발생했습니다.';
      setError(msg);
      // negative cache: 같은 입력 즉시 재시도 시 1분간 API 안 부르게 막아 토큰비 보호
      if (activeCacheKey) {
        useReportCacheStore.getState().setError('gunghap', activeCacheKey, msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('category');
    setResult('');
    setError('');
    setOther(defaultOther);
    setPet(defaultPet);
    setOtherProfileId('');
    // 다시 다음 진입 시 useEffect가 상황에 맞게 모드 결정하도록 manual로 리셋
    setOtherMode('manual');
    setMyRole('');
    setOtherRole('');
    setCustomLabel('');
  };

  // 궁합 분석 로딩 전체화면
  if (loading) {
    return (
      <AILoadingBar
        label="궁합 분석중"
        minLabel="25초"
        maxLabel="1분"
        estimatedSeconds={40}
        messages={[
          '두 사람의 원국을 비교하는 중입니다',
          '합충 관계와 오행 조화를 분석하는 중입니다',
          '십성으로 본 관계 패턴을 읽는 중입니다',
          '대운 흐름과 인연의 타이밍을 보는 중입니다',
        ]}
        topContent={
          <div className="text-[17px] font-semibold text-text-primary">
            {getCategoryDisplayLabel()} 궁합
          </div>
        }
      />
    );
  }

  // 비로그인 처리
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary mb-4">궁합 분석은 로그인 후 이용 가능합니다.</p>
        <Link href="/login?from=/saju/gunghap" className="text-cta font-semibold underline">로그인하기</Link>
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

  /**
   * 뒤로가기: step 별 이전 단계로 → 첫 단계(category)에선 홈으로.
   * 단계 흐름이 있는 페이지라 명시적 분기.
   */
  const handleGunghapBack = () => {
    if (step === 'result') {
      setStep('input');
    } else if (step === 'input') {
      setStep(isPetCategory ? 'category' : 'role');
    } else if (step === 'role') {
      setStep('category');
    } else if (typeof window !== 'undefined') {
      window.history.length > 1 ? window.history.back() : window.location.assign('/');
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* 헤더 — 뒤로가기 + 타이틀 */}
      <div className="px-5 pt-4 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-1">
          <BackButton onClick={handleGunghapBack} label="이전 단계" className="-ml-2 mt-1" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
              궁합 분석
            </h1>
            <p className="text-sm text-text-secondary">두 사람의 사주로 보는 인연의 흐름</p>
          </div>
        </motion.div>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-1.5">
          {stepOrder.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 flex-1">
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-bold transition-all
                  ${step === s ? 'bg-cta text-white scale-110' : i < stepIdx ? 'bg-cta/50 text-white' : 'bg-white/10 text-text-tertiary'}`}>
                  {i + 1}
                </div>
                <span className={`text-[11px] font-medium whitespace-nowrap transition-colors
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
                <p className={`text-[13px] font-bold mb-2.5 uppercase tracking-wider ${group.groupColor}`}>
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
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-text-primary leading-tight">{cat.label}</p>
                        <p className="text-[12px] text-text-secondary mt-0.5 leading-tight">{cat.desc}</p>
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
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-text-primary text-[16px] placeholder-text-tertiary focus:border-cta/50 focus:outline-none transition"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setStep('role')}
              disabled={category === 'custom' && !customLabel.trim()}
              className="w-full py-3.5 rounded-2xl bg-cta text-white font-bold text-[17px] active:scale-[0.98] transition-all disabled:opacity-40"
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
              <span className="text-[15px] font-semibold text-text-primary">{getCategoryDisplayLabel()}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] space-y-4">
              <div>
                <p className="text-[15px] font-bold text-text-primary mb-0.5">
                  각자의 역할을 입력해주세요
                </p>
                <p className="text-[13px] text-text-tertiary">선택사항 · 입력할수록 분석이 더 개인화됩니다</p>
              </div>

              {/* 내 역할 */}
              <div>
                <label className="text-[13px] font-medium text-text-tertiary mb-1.5 block">
                  {selectedProfile?.name}의 역할
                </label>
                <input
                  type="text"
                  value={myRole}
                  onChange={e => setMyRole(e.target.value)}
                  placeholder="예: 남자친구, 엄마, 팬, 직속 상사"
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary text-[16px] placeholder-text-tertiary focus:border-cta/50 focus:outline-none transition"
                />
              </div>

              {/* 상대 역할 */}
              <div>
                <label className="text-[13px] font-medium text-text-tertiary mb-1.5 block">
                  상대방의 역할
                </label>
                <input
                  type="text"
                  value={otherRole}
                  onChange={e => setOtherRole(e.target.value)}
                  placeholder="예: 여자친구, 딸, 아이돌, 팀장"
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary text-[16px] placeholder-text-tertiary focus:border-cta/50 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setStep('category')}
                className="px-5 py-3.5 rounded-2xl border border-white/15 text-text-secondary font-medium text-[16px] active:scale-[0.98] transition-all"
              >
                이전
              </button>
              <button
                onClick={() => setStep('input')}
                className="flex-1 py-3.5 rounded-2xl bg-cta text-white font-bold text-[17px] active:scale-[0.98] transition-all"
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
                <p className="text-[13px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">내 프로필</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {profiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setMyProfileId(p.id)}
                      className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-[15px] font-medium border transition-all
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
                <div className={`px-3 py-1 rounded-full bg-gradient-to-br ${selectedCat.accent} text-[12px] font-semibold text-text-primary border border-white/15 flex-shrink-0`}>
                  {getCategoryDisplayLabel()}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-text-primary">{selectedProfile.name}</p>
                  <p className="text-[13px] text-text-secondary">{selectedProfile.birth_date} · {selectedProfile.gender === 'male' ? '남' : '여'}</p>
                </div>
                {(myRole.trim() || otherRole.trim()) && (
                  <div className="ml-auto text-[12px] text-text-tertiary text-right">
                    {myRole.trim() && <div>내 역할: {myRole}</div>}
                    {otherRole.trim() && <div>상대 역할: {otherRole}</div>}
                  </div>
                )}
              </div>
            )}

            {/* 상대방 입력 */}
            <div className="p-4 rounded-2xl bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)] space-y-4">
              <p className="text-[15px] font-bold text-text-primary">상대방 정보</p>

              {/* 모드 탭 — 내 등록 프로필 중 상대로 쓸 수 있는 게 있을 때만 노출 */}
              {otherProfileChoices.length > 0 && (
                <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setOtherMode('profile')}
                    className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-all
                      ${otherMode === 'profile' ? 'bg-cta/20 text-cta' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    내 프로필에서
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtherMode('manual')}
                    className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-all
                      ${otherMode === 'manual' ? 'bg-cta/20 text-cta' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    직접 입력
                  </button>
                </div>
              )}

              {otherMode === 'profile' ? (
                // ── 모드 A: 내 등록 프로필 중에서 선택 ──
                <div>
                  <p className="text-[13px] font-medium text-text-tertiary mb-2">
                    상대로 분석할 프로필을 선택하세요
                  </p>
                  {otherProfileChoices.length === 0 ? (
                    <p className="text-[13px] text-text-tertiary py-2">
                      선택 가능한 다른 프로필이 없어요. 먼저 프로필을 추가하거나 직접 입력을 이용해주세요.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {otherProfileChoices.map(p => {
                        const active = selectedOtherProfile?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setOtherProfileId(p.id)}
                            className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98]
                              ${active ? 'bg-cta/15 border-cta/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[rgba(124,92,252,0.12)] flex items-center justify-center text-lg shrink-0">
                                {p.gender === 'male' ? '👨' : '👩'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[15px] font-semibold ${active ? 'text-cta' : 'text-text-primary'}`}>
                                  {p.name}
                                </p>
                                <p className="text-[12px] text-text-tertiary mt-0.5">
                                  {p.birth_date.replace(/-/g, '.')}
                                  {p.birth_time ? ` ${p.birth_time}` : ' (시간 모름)'}
                                  {' · '}
                                  {p.gender === 'male' ? '남' : '여'}
                                </p>
                              </div>
                              {active && (
                                <span className="text-[12px] px-2 py-0.5 rounded-full bg-cta/20 text-cta font-semibold flex-shrink-0">
                                  선택됨
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                // ── 모드 B: 직접 입력 ──
                <div className="space-y-4">
                  <div>
                    <label className="text-[13px] font-medium text-text-tertiary mb-1.5 block">이름</label>
                    <input
                      type="text"
                      value={other.name}
                      onChange={e => setOther(o => ({ ...o, name: e.target.value }))}
                      placeholder="상대방 이름"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary text-[16px] placeholder-text-tertiary focus:border-cta/50 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="text-[13px] font-medium text-text-tertiary mb-1.5 block">생년월일</label>
                    <input
                      type="date"
                      value={other.birth_date}
                      onChange={e => setOther(o => ({ ...o, birth_date: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary text-[16px] focus:border-cta/50 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[13px] font-medium text-text-tertiary block">
                        출생시간
                      </label>
                      <label className="text-[13px] flex items-center gap-1 text-text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!other.birth_time}
                          onChange={(e) => {
                            // 모름 체크 → birth_time 비움 / 해제 시 정오로 임시 채워줌
                            setOther(o => ({ ...o, birth_time: e.target.checked ? '' : '12:00' }));
                          }}
                          className="accent-cta"
                        />
                        시간 모름
                      </label>
                    </div>
                    <input
                      type="time"
                      value={other.birth_time}
                      onChange={e => setOther(o => ({ ...o, birth_time: e.target.value }))}
                      disabled={!other.birth_time && other.birth_time === ''}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-primary text-[16px] focus:border-cta/50 focus:outline-none transition disabled:opacity-40"
                    />
                    {!other.birth_time && (
                      <p className="text-[12px] text-text-tertiary mt-1">
                        시간을 모르면 시주(時柱)가 없는 삼주추명으로 분석되어, 자녀·말년 영역 해석은 제한적입니다.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[13px] font-medium text-text-tertiary mb-1.5 block">성별</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['male', 'female'] as const).map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setOther(o => ({ ...o, gender: g }))}
                          className={`py-2.5 rounded-xl text-[15px] font-medium border transition-all
                            ${other.gender === g ? 'bg-cta/20 border-cta/50 text-cta' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
                        >
                          {g === 'male' ? '남성' : '여성'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[13px] font-medium text-text-tertiary mb-1.5 block">역법</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['solar', 'lunar'] as const).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setOther(o => ({ ...o, calendar_type: c }))}
                          className={`py-2.5 rounded-xl text-[15px] font-medium border transition-all
                            ${other.calendar_type === c ? 'bg-cta/20 border-cta/50 text-cta' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
                        >
                          {c === 'solar' ? '양력' : '음력'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-[15px] text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setStep('role')}
                className="px-5 py-3.5 rounded-2xl border border-white/15 text-text-secondary font-medium text-[16px] active:scale-[0.98] transition-all"
              >
                이전
              </button>
              <button
                disabled={!isOtherValid || loading}
                onClick={handleAnalyze}
                className="flex-1 py-3.5 rounded-2xl bg-cta text-white font-bold text-[17px] active:scale-[0.98] transition-all disabled:opacity-40"
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
                <span className="inline-block w-1 h-10 rounded-full bg-white/60" />
                <div className="flex-1">
                  <p className="text-[13px] text-text-tertiary uppercase tracking-wider">{getCategoryDisplayLabel()} 궁합</p>
                  <p className="text-[16px] font-bold text-text-primary mt-0.5">
                    {selectedProfile?.name}
                    {isPetCategory ? ' 🐾 ' : ' · '}
                    {otherDisplayName}
                    {isPetCategory && pet.species && (
                      <span className="text-[13px] font-normal text-text-secondary ml-1">
                        ({PET_SPECIES_VIBE[pet.species].label})
                      </span>
                    )}
                  </p>
                  {!isPetCategory && (myRole.trim() || otherRole.trim()) && (
                    <p className="text-[13px] text-text-secondary mt-0.5">
                      {myRole.trim() && `${selectedProfile?.name}: ${myRole}`}
                      {myRole.trim() && otherRole.trim() && ' / '}
                      {otherRole.trim() && `${otherDisplayName}: ${otherRole}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 반려동물 재미 해석 안내 — 결과 상단 */}
            {isPetCategory && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[13px] text-amber-200 leading-relaxed">
                💡 이 결과는 <b>주인의 사주 + 동물 상징 기운</b>으로 풀어낸 재미 해석입니다. 정통 사주 풀이가 아닌 라이프스타일 참고용으로 가볍게 봐주세요.
              </div>
            )}

            {/* 결과 본문 */}
            <div className="p-5 rounded-2xl bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
              <div className="text-[16px] text-text-primary leading-[1.85] whitespace-pre-wrap">
                {result}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2 mt-5">
              <button
                onClick={reset}
                className="flex-1 py-3.5 rounded-2xl border border-white/15 text-text-secondary font-medium text-[16px] active:scale-[0.98] transition-all"
              >
                처음으로
              </button>
              <button
                onClick={() => { setStep('input'); setResult(''); setError(''); }}
                className="flex-1 py-3.5 rounded-2xl bg-cta/20 border border-cta/40 text-cta font-bold text-[16px] active:scale-[0.98] transition-all"
              >
                다른 상대 분석
              </button>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

      <RestoreReportModal
        open={!!cacheGate}
        title="궁합 분석"
        onUseCached={handleUseCached}
        onRefresh={handleRefetch}
        onClose={() => setCacheGate(null)}
      />
    </div>
  );
}
