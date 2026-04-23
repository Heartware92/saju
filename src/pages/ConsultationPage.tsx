'use client';

/**
 * 상담소 — 챗봇 형태의 사주 AI 상담
 * - 프로필별 사주 데이터를 시스템 프롬프트에 자동 주입
 * - 연애상태/직업 상태값 로컬 저장 (프로필별)
 * - 1회 질문당 달 크레딧 1 소모
 * - 대화 히스토리는 세션 스토리지에 유지 (프로필 전환 시 초기화)
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import { useCreditStore } from '../store/useCreditStore';
import { computeSajuFromProfile } from '../utils/profileSaju';
import { buildConsultationSystemPrompt, type ConsultationStatus } from '../constants/prompts';
import { sanitizeAIOutput } from '../services/fortuneService';
import { supabase } from '../services/supabase';
import {
  CONSULTATION_QUESTIONS_PER_PACK,
  CONSULTATION_PACK_SUN_COST,
  CONSULTATION_PACK_MOON_COST,
} from '../constants/creditCosts';

// ──────────────────────────────────────────────
// 타입·상수
// ──────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  /** 답변 직후 제안된 후속 질문 3개 (assistant 메시지에만 채워짐) */
  followups?: string[];
}

const RELATIONSHIP_PRESETS = ['솔로', '썸타는 중', '연애중', '결혼했어요', '새로운 출발', '기타'];

const QUICK_QUESTIONS = [
  '올해 재물운은 어떤가요?',
  '요즘 연애운이 궁금해요',
  '이직을 고민 중인데 올해 해도 될까요?',
  '건강운 어떤지 봐주세요',
  '내가 조심해야 할 게 뭔가요?',
];

// localStorage 키
const STATUS_KEY = (profileId: string) => `sangdamso:status:${profileId}`;
const CONVERSATIONS_KEY = (profileId: string) => `sangdamso:conversations:${profileId}`;
const ACTIVE_KEY = (profileId: string) => `sangdamso:active:${profileId}`;
// 레거시 — 단일 히스토리(v1). 로드 시 conversations[0] 으로 마이그레이션 후 삭제.
const LEGACY_HISTORY_KEY = (profileId: string) => `sangdamso:history:${profileId}`;
// 기기 저장 안내 배너 — 최초 1회
const STORAGE_NOTICE_KEY = 'sangdamso:storage-notice-dismissed';

const MAX_CONVERSATIONS_PER_PROFILE = 20;
const MAX_MESSAGES_PER_CONVERSATION = 50;

interface StoredConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

function newConversation(): StoredConversation {
  return {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `c-${Date.now()}-${Math.random()}`,
    title: '새 대화',
    messages: [],
    updatedAt: Date.now(),
  };
}

function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find(m => m.role === 'user');
  if (!firstUser) return '새 대화';
  return firstUser.content.slice(0, 24).trim() || '새 대화';
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(ts).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// ──────────────────────────────────────────────
// 컴포넌트
// ──────────────────────────────────────────────
export default function ConsultationPage() {
  const { user } = useUserStore();
  const { profiles, fetchProfiles } = useProfileStore();
  const {
    sunBalance, moonBalance, fetchBalance,
    consultationRemaining, purchaseConsultationPack, useConsultationQuestion,
  } = useCreditStore();
  const [packBuying, setPackBuying] = useState(false);
  const [showPackModal, setShowPackModal] = useState(false);

  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [status, setStatus] = useState<ConsultationStatus>({});
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [jobInput, setJobInput] = useState('');
  const [relationshipSelect, setRelationshipSelect] = useState('');
  const [customRelationship, setCustomRelationship] = useState('');

  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storageBannerVisible, setStorageBannerVisible] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeConv = useMemo(
    () => conversations.find(c => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );
  const messages = activeConv?.messages ?? [];

  // messages setter — 활성 대화의 messages만 업데이트 (다른 대화는 유지)
  const setMessages = (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== activeConversationId) return c;
      const nextMessages = typeof updater === 'function' ? updater(c.messages) : updater;
      return {
        ...c,
        messages: nextMessages,
        title: deriveTitle(nextMessages),
        updatedAt: Date.now(),
      };
    }));
  };

  // 초기화: 프로필 불러오기
  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchBalance();
    }
  }, [user, fetchProfiles, fetchBalance]);

  // 기기 저장 안내 배너 — 최초 1회
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem(STORAGE_NOTICE_KEY);
    if (!dismissed) setStorageBannerVisible(true);
  }, []);

  // 기본 프로필 자동 선택
  useEffect(() => {
    if (!selectedProfileId && profiles.length > 0) {
      const primary = profiles.find(p => p.is_primary) ?? profiles[0];
      setSelectedProfileId(primary.id);
    }
  }, [profiles, selectedProfileId]);

  const selectedProfile = useMemo(
    () => profiles.find(p => p.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );

  const saju = useMemo(() => {
    if (!selectedProfile) return null;
    return computeSajuFromProfile(selectedProfile);
  }, [selectedProfile]);

  // 프로필 전환 시: 상태·대화 목록 로드 (진행 중 응답이 엉뚱한 프로필에 꽂히지 않도록 로딩 리셋)
  useEffect(() => {
    if (!selectedProfileId) return;
    if (typeof window === 'undefined') return;

    // 진행 중 로딩/에러 리셋
    setLoading(false);
    setError('');

    // 상태 로드
    try {
      const raw = localStorage.getItem(STATUS_KEY(selectedProfileId));
      setStatus(raw ? JSON.parse(raw) : {});
    } catch {
      setStatus({});
    }

    // 대화 목록 로드 + 레거시 단일 히스토리 마이그레이션
    let loadedConvs: StoredConversation[] = [];
    try {
      const rawConvs = localStorage.getItem(CONVERSATIONS_KEY(selectedProfileId));
      if (rawConvs) {
        loadedConvs = JSON.parse(rawConvs);
      } else {
        // 레거시 히스토리 확인 → 첫 대화로 전환
        const legacyRaw = localStorage.getItem(LEGACY_HISTORY_KEY(selectedProfileId));
        if (legacyRaw) {
          const legacyMessages: ChatMessage[] = JSON.parse(legacyRaw);
          if (legacyMessages.length > 0) {
            const migrated: StoredConversation = {
              ...newConversation(),
              messages: legacyMessages,
              title: deriveTitle(legacyMessages),
            };
            loadedConvs = [migrated];
          }
          localStorage.removeItem(LEGACY_HISTORY_KEY(selectedProfileId));
        }
      }
    } catch {
      loadedConvs = [];
    }

    // 활성 대화 결정: 저장된 active > 가장 최근 > 새 빈 대화
    let activeId = '';
    try {
      activeId = localStorage.getItem(ACTIVE_KEY(selectedProfileId)) || '';
    } catch { /* ignore */ }

    if (loadedConvs.length === 0) {
      const fresh = newConversation();
      loadedConvs = [fresh];
      activeId = fresh.id;
    } else if (!activeId || !loadedConvs.find(c => c.id === activeId)) {
      activeId = [...loadedConvs].sort((a, b) => b.updatedAt - a.updatedAt)[0].id;
    }

    setConversations(loadedConvs);
    setActiveConversationId(activeId);
  }, [selectedProfileId]);

  // 대화 목록 자동 저장 + 크기 제한
  useEffect(() => {
    if (!selectedProfileId || conversations.length === 0) return;
    try {
      // 메시지 50개 초과 시 오래된 것 잘라냄 + 대화 20개 초과 시 오래된 것 삭제
      const trimmed = conversations
        .map(c => ({
          ...c,
          messages: c.messages.length > MAX_MESSAGES_PER_CONVERSATION
            ? c.messages.slice(-MAX_MESSAGES_PER_CONVERSATION)
            : c.messages,
        }))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_CONVERSATIONS_PER_PROFILE);

      localStorage.setItem(CONVERSATIONS_KEY(selectedProfileId), JSON.stringify(trimmed));
      localStorage.setItem(ACTIVE_KEY(selectedProfileId), activeConversationId);
    } catch {
      /* ignore */
    }
  }, [conversations, activeConversationId, selectedProfileId]);

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // 분석 중 페이지 이탈 경고 (브라우저 닫기·새로고침)
  useEffect(() => {
    if (!loading) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Chrome/Edge는 빈 문자열만 있어도 기본 경고 표시
      e.returnValue = '사주 분석 중입니다. 지금 나가면 답변이 사라져요.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [loading]);

  // 언마운트 시 진행 중 스트림 중단
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // 상태 저장
  const saveStatus = () => {
    if (!selectedProfileId) return;
    const finalRelationship = relationshipSelect === '기타'
      ? customRelationship.trim()
      : relationshipSelect;
    const next: ConsultationStatus = {
      relationshipStatus: finalRelationship || undefined,
      job: jobInput.trim() || undefined,
    };
    setStatus(next);
    try {
      localStorage.setItem(STATUS_KEY(selectedProfileId), JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setStatusModalOpen(false);
  };

  // 상태 모달 열 때 현재값 주입
  const openStatusModal = () => {
    const current = status.relationshipStatus || '';
    if (RELATIONSHIP_PRESETS.includes(current)) {
      setRelationshipSelect(current);
      setCustomRelationship('');
    } else if (current) {
      setRelationshipSelect('기타');
      setCustomRelationship(current);
    } else {
      setRelationshipSelect('');
      setCustomRelationship('');
    }
    setJobInput(status.job || '');
    setStatusModalOpen(true);
  };

  // 질문 전송
  const handleSend = async (questionOverride?: string) => {
    const question = (questionOverride ?? inputText).trim();
    if (!question || loading || !saju || !selectedProfile) return;

    // 팩 잔량 체크 — 남은 질문이 0이면 구매 모달 열기
    if (consultationRemaining <= 0) {
      setShowPackModal(true);
      return;
    }
    // 팩에서 1질문 차감 (크레딧은 이미 팩 구매 시점에 차감됨)
    const ok = useConsultationQuestion();
    if (!ok) {
      setShowPackModal(true);
      return;
    }

    setError('');
    setInputText('');

    // 전송 시점 프로필 id 캡처 — 도중에 전환되면 응답 버림
    const profileAtSend = selectedProfileId;

    const userMsg: ChatMessage = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `u-${Date.now()}-${Math.random()}`,
      role: 'user',
      content: question,
      createdAt: Date.now(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    // AbortController로 중단 가능하게
    const controller = new AbortController();
    abortRef.current = controller;

    // assistant 메시지 자리 미리 확보 (타이핑 효과 위해)
    const botMsgId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `a-${Date.now()}-${Math.random()}`;

    try {
      // 세션 토큰
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');

      // 시스템 프롬프트 구성
      const systemPrompt = buildConsultationSystemPrompt(saju, {
        name: selectedProfile.name,
        birth_date: selectedProfile.birth_date,
        gender: selectedProfile.gender,
        calendar_type: selectedProfile.calendar_type,
      }, status);

      // 대화 히스토리 → Gemini 포맷
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        content: m.content,
      }));

      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ systemPrompt, history, userMessage: question }),
        signal: controller.signal,
      });

      // 에러 응답은 JSON (스트리밍 아님)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || '응답 생성 실패');
      }
      if (!res.body) throw new Error('응답 본문이 비어 있습니다.');

      // 빈 assistant 메시지 추가 (타이핑 자리)
      if (selectedProfileId === profileAtSend) {
        setMessages(prev => [...prev, {
          id: botMsgId,
          role: 'assistant',
          content: '',
          createdAt: Date.now(),
        }]);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';
      let accumulated = '';
      let streamError: string | null = null;
      let gotDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });

        // SSE 프레임 파싱
        let idx: number;
        while ((idx = sseBuffer.indexOf('\n\n')) !== -1) {
          const frame = sseBuffer.slice(0, idx).trim();
          sseBuffer = sseBuffer.slice(idx + 2);
          if (!frame.startsWith('data:')) continue;

          const jsonStr = frame.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr) as { delta?: string; done?: boolean; error?: string };
            if (parsed.error) {
              streamError = parsed.error;
              continue;
            }
            if (parsed.done) {
              gotDone = true;
              continue;
            }
            if (parsed.delta) {
              accumulated += parsed.delta;
              // 전송 시점 프로필과 여전히 같을 때만 UI 반영
              if (selectedProfileId === profileAtSend) {
                const snapshot = accumulated;
                setMessages(prev => prev.map(m =>
                  m.id === botMsgId ? { ...m, content: snapshot } : m
                ));
              }
            }
          } catch {
            /* 파싱 실패 프레임 무시 */
          }
        }
      }

      if (streamError) throw new Error(streamError);
      if (!gotDone && accumulated.length === 0) throw new Error('AI 응답이 비어 있습니다.');

      // 완료 후 sanitize 한 번 더 (마크다운/이모지 최종 정리)
      const cleaned = sanitizeAIOutput(accumulated);
      if (selectedProfileId === profileAtSend) {
        setMessages(prev => prev.map(m =>
          m.id === botMsgId ? { ...m, content: cleaned } : m
        ));
      }

      // 팩 모델: 질문은 팩 구매 시점에 이미 차감됨. 여기서 추가 차감 없음.

      // 후속 질문 제안 (fire-and-forget — 실패해도 메인 UX 영향 없음)
      if (selectedProfileId === profileAtSend && cleaned) {
        fetch('/api/consultation/followups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ lastQuestion: question, lastAnswer: cleaned }),
        })
          .then(r => r.ok ? r.json() : null)
          .then((data: { suggestions?: string[] } | null) => {
            const suggestions = data?.suggestions ?? [];
            if (suggestions.length === 0) return;
            // 여전히 같은 프로필이고 해당 메시지가 남아있으면 업데이트
            if (selectedProfileId !== profileAtSend) return;
            setMessages(prev => prev.map(m =>
              m.id === botMsgId ? { ...m, followups: suggestions } : m
            ));
          })
          .catch(() => { /* 후속 제안 실패는 무시 */ });
      }
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') {
        // 사용자가 중단 (페이지 이동 등) — 조용히 종료
        return;
      }
      // 실패 시 빈 assistant 메시지 제거
      setMessages(prev => prev.filter(m => m.id !== botMsgId));
      setError(e instanceof Error ? e.message : '응답 생성 중 오류가 발생했습니다.');
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    abortRef.current?.abort();
    setError('');
    setLoading(false);

    // 현재 활성 대화가 비어있으면 재사용 (빈 대화 쌓임 방지)
    if (activeConv && activeConv.messages.length === 0) return;

    const fresh = newConversation();
    setConversations(prev => [fresh, ...prev]);
    setActiveConversationId(fresh.id);
    setDrawerOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    if (id === activeConversationId) { setDrawerOpen(false); return; }
    abortRef.current?.abort();
    setError('');
    setLoading(false);
    setActiveConversationId(id);
    setDrawerOpen(false);
  };

  const handleDeleteConversation = (id: string) => {
    if (!confirm('이 대화를 삭제할까요?')) return;
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      // 활성 대화가 삭제되면 다른 대화로 전환하거나 새로 생성
      if (id === activeConversationId) {
        if (next.length > 0) {
          setActiveConversationId(next[0].id);
        } else {
          const fresh = newConversation();
          setActiveConversationId(fresh.id);
          return [fresh];
        }
      }
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 비로그인
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary mb-4">상담소는 로그인 후 이용 가능합니다.</p>
        <Link href="/login?from=/sangdamso" className="text-cta font-semibold underline">로그인하기</Link>
      </div>
    );
  }

  if (!selectedProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary mb-4">프로필을 먼저 등록해야 상담이 가능해요.</p>
        <Link href="/saju/input" className="text-cta font-semibold underline">프로필 등록</Link>
      </div>
    );
  }

  const showWelcome = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">

      {/* ── 상단 헤더 ── */}
      <div className="flex-shrink-0 px-5 pt-6 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-serif)' }}>
              상담소
            </h1>
            <p className="text-[13px] text-text-tertiary mt-0.5">
              사주 기반 1:1 AI 상담 · 질문팩 ☀️ {CONSULTATION_PACK_SUN_COST} 또는 🌙 {CONSULTATION_PACK_MOON_COST} → {CONSULTATION_QUESTIONS_PER_PACK}질문
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              title="이전 대화 목록"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <span className="hidden sm:inline">목록</span>
              {conversations.length > 1 && (
                <span className="text-[11px] text-cta font-bold">{conversations.length}</span>
              )}
            </button>
            <button
              onClick={handleNewConversation}
              disabled={loading}
              className="flex items-center gap-1 text-[13px] text-cta hover:bg-cta/10 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-40"
              title="새 대화 시작"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>새 대화</span>
            </button>
          </div>
        </div>

        {/* 프로필 선택 탭 */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProfileId(p.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[14px] font-medium border transition-all
                ${selectedProfileId === p.id ? 'bg-cta/20 border-cta/50 text-cta' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* 상태 요약 + 수정 */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-wrap gap-1.5 text-[12px]">
            {status.relationshipStatus && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300">
                💕 {status.relationshipStatus}
              </span>
            )}
            {status.job && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300">
                💼 {status.job}
              </span>
            )}
            {!status.relationshipStatus && !status.job && (
              <span className="text-text-tertiary">상태 미설정</span>
            )}
          </div>
          <button
            onClick={openStatusModal}
            className="text-[13px] text-cta hover:text-cta/80 font-medium"
          >
            상태 수정
          </button>
        </div>
      </div>

      {/* ── 기기 저장 안내 배너 (최초 1회) ── */}
      <AnimatePresence>
        {storageBannerVisible && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mx-4 mt-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5"
          >
            <span className="text-amber-400 text-[16px] mt-0.5 flex-shrink-0">⚠</span>
            <p className="text-[14px] text-amber-200/80 leading-relaxed flex-1">
              대화 내역은 <span className="font-semibold text-amber-300">이 기기에만</span> 저장됩니다. 다른 기기나 브라우저에서는 보이지 않으며, 브라우저 데이터를 지우면 사라질 수 있어요.
            </p>
            <button
              onClick={() => {
                setStorageBannerVisible(false);
                localStorage.setItem(STORAGE_NOTICE_KEY, '1');
              }}
              className="flex-shrink-0 text-amber-400/60 hover:text-amber-400 text-[16px] leading-none mt-0.5"
              aria-label="닫기"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 메시지 영역 ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* 웰컴 메시지 */}
        {showWelcome && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-[rgba(20,12,38,0.65)] border border-[var(--border-subtle)] rounded-2xl p-4 mb-4">
              <p className="text-[16px] text-text-primary leading-relaxed">
                안녕하세요, <span className="font-bold text-cta">{selectedProfile.name}님</span>. 상담소에 오신 것을 환영해요.
              </p>
              <p className="text-[15px] text-text-secondary leading-relaxed mt-2">
                재물운·연애운·건강운 무엇이든 편하게 물어보세요. {selectedProfile.name}님의 사주를 바탕으로 맞춤 답변을 드려요.
              </p>
              <p className="text-[13px] text-text-tertiary mt-3">
                💡 더 정확한 답변을 위해 상단의 <span className="text-cta">상태 수정</span>에서 연애상태와 직업을 입력해보세요.
              </p>
              <p className="text-[13px] text-text-tertiary/60 mt-2 border-t border-white/5 pt-2">
                대화 내역은 이 기기에만 저장되며, 다른 기기나 브라우저에서는 보이지 않아요.
              </p>
            </div>

            <p className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-1">
              이런 질문을 많이 해요
            </p>
            <div className="flex flex-col gap-2">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  className="text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[15px] text-text-secondary hover:border-cta/40 hover:text-text-primary transition-all disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 메시지 목록 */}
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1;
            const isStreaming = loading && msg.role === 'assistant' && isLast;
            const showFollowups = !loading
              && msg.role === 'assistant'
              && isLast
              && (msg.followups?.length ?? 0) > 0;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/40 to-indigo-500/30 flex items-center justify-center text-sm mr-2 border border-white/15">
                      🌙
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-[16px] leading-[1.75] whitespace-pre-wrap
                      ${msg.role === 'user'
                        ? 'bg-cta/90 text-white rounded-tr-sm'
                        : 'bg-[rgba(20,12,38,0.75)] border border-[var(--border-subtle)] text-text-primary rounded-tl-sm'}`}
                  >
                    {msg.content}
                    {isStreaming && (
                      <span className="inline-block w-[8px] h-[14px] bg-cta/80 ml-0.5 -mb-0.5 align-middle animate-pulse" />
                    )}
                  </div>
                </div>

                {/* 후속 질문 제안 칩 */}
                {showFollowups && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-col gap-1.5 mt-2 ml-10 max-w-[85%]"
                  >
                    <p className="text-[12px] font-medium text-text-tertiary uppercase tracking-wider px-1">
                      이어서 물어볼까요
                    </p>
                    {(msg.followups ?? []).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        disabled={loading}
                        className="text-left px-3 py-2 rounded-xl bg-cta/10 border border-cta/30 text-[14px] text-cta hover:bg-cta/20 hover:border-cta/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* 응답 시작 전 짧은 대기 표시 (첫 청크 도착 전) */}
        {loading && (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/40 to-indigo-500/30 flex items-center justify-center text-sm mr-2 border border-white/15">
              🌙
            </div>
            <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-[rgba(20,12,38,0.75)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-cta animate-pulse" style={{ animationDelay: '0s' }} />
                <span className="inline-block w-2 h-2 rounded-full bg-cta animate-pulse" style={{ animationDelay: '0.2s' }} />
                <span className="inline-block w-2 h-2 rounded-full bg-cta animate-pulse" style={{ animationDelay: '0.4s' }} />
                <span className="text-[14px] text-text-secondary ml-1">사주 데이터를 엮는 중...</span>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-[15px] text-red-400 text-center">
            {error}
          </div>
        )}
      </div>

      {/* ── 입력창 ── */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-[var(--border-subtle)] bg-[rgba(20,12,38,0.5)]">
        <div className="flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="무엇이든 물어보세요 (Enter 전송)"
            rows={1}
            maxLength={300}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-text-primary text-[16px] placeholder-text-tertiary focus:border-cta/50 focus:outline-none resize-none transition disabled:opacity-60"
            style={{ maxHeight: '100px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading}
            className="flex-shrink-0 w-11 h-11 rounded-full bg-cta text-white flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="전송"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22,2 15,22 11,13 2,9 22,2" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1 flex-wrap gap-y-1">
          <span className="text-[12px] text-text-tertiary">{inputText.length}/300</span>
          <span className="text-[12px] text-text-tertiary">
            남은 질문 {consultationRemaining} · 보유 ☀️ {sunBalance} 🌙 {moonBalance}
            {consultationRemaining <= 0 && (
              <button
                onClick={() => setShowPackModal(true)}
                className="ml-2 text-cta underline font-semibold"
              >
                질문팩 구매
              </button>
            )}
          </span>
        </div>
      </div>

      {/* ── 질문팩 구매 모달 ── */}
      <AnimatePresence>
        {showPackModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !packBuying && setShowPackModal(false)}
              className="fixed inset-0 z-[80] bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[81] flex items-center justify-center px-5 pointer-events-none"
            >
              <div className="w-full max-w-sm rounded-2xl bg-[rgba(20,12,38,0.98)] border border-cta/40 p-5 pointer-events-auto">
                <h3 className="text-lg font-bold text-text-primary mb-1">질문팩 구매</h3>
                <p className="text-[13px] text-text-secondary mb-4 leading-relaxed">
                  질문팩 1개로 <b className="text-cta">{CONSULTATION_QUESTIONS_PER_PACK}번</b> 연속으로 상담할 수 있어요.
                  결제 방식을 선택해 주세요.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    disabled={packBuying || sunBalance < CONSULTATION_PACK_SUN_COST}
                    onClick={async () => {
                      setPackBuying(true);
                      const ok = await purchaseConsultationPack('sun');
                      setPackBuying(false);
                      if (ok) setShowPackModal(false);
                      else setError('구매에 실패했어요. 잠시 후 다시 시도해 주세요.');
                    }}
                    className="py-3 rounded-xl bg-cta text-white font-semibold text-[15px] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ☀️ {CONSULTATION_PACK_SUN_COST} 해로 구매 ({CONSULTATION_QUESTIONS_PER_PACK}질문)
                  </button>
                  <button
                    disabled={packBuying || moonBalance < CONSULTATION_PACK_MOON_COST}
                    onClick={async () => {
                      setPackBuying(true);
                      const ok = await purchaseConsultationPack('moon');
                      setPackBuying(false);
                      if (ok) setShowPackModal(false);
                      else setError('구매에 실패했어요. 잠시 후 다시 시도해 주세요.');
                    }}
                    className="py-3 rounded-xl bg-white/10 border border-white/20 text-text-primary font-semibold text-[15px] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    🌙 {CONSULTATION_PACK_MOON_COST} 달로 구매 ({CONSULTATION_QUESTIONS_PER_PACK}질문)
                  </button>
                  <button
                    disabled={packBuying}
                    onClick={() => setShowPackModal(false)}
                    className="py-2 text-[13px] text-text-tertiary"
                  >
                    취소
                  </button>
                </div>
                <p className="text-[11px] text-text-tertiary mt-3">
                  보유: ☀️ {sunBalance} · 🌙 {moonBalance}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 대화 목록 드로어 ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[75] bg-black/60"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 bottom-0 z-[76] w-[min(340px,85vw)] bg-[rgba(20,12,38,0.98)] border-r border-white/15 shadow-2xl flex flex-col"
            >
              <div className="flex-shrink-0 px-4 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[17px] font-bold text-text-primary">대화 목록</p>
                  <p className="text-[12px] text-text-tertiary mt-0.5">
                    {selectedProfile?.name}님 · {conversations.length}개
                  </p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary"
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>

              <button
                onClick={handleNewConversation}
                className="mx-3 mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cta/15 border border-cta/40 text-cta font-semibold text-[15px] hover:bg-cta/25 transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                새 대화 시작
              </button>

              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
                {[...conversations]
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map(c => {
                    const isActive = c.id === activeConversationId;
                    const isEmpty = c.messages.length === 0;
                    return (
                      <div
                        key={c.id}
                        className={`group relative rounded-xl border transition-all
                          ${isActive ? 'bg-cta/15 border-cta/50' : 'bg-white/5 border-white/10 hover:border-white/25'}`}
                      >
                        <button
                          onClick={() => handleSelectConversation(c.id)}
                          className="w-full text-left px-3 py-2.5 pr-9"
                        >
                          <p className={`text-[15px] font-medium truncate ${isActive ? 'text-cta' : 'text-text-primary'}`}>
                            {isEmpty ? '빈 대화' : c.title}
                          </p>
                          <p className="text-[12px] text-text-tertiary mt-0.5">
                            {c.messages.length}개 메시지 · {formatRelativeTime(c.updatedAt)}
                          </p>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteConversation(c.id); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="대화 삭제"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
              </div>

              <div className="flex-shrink-0 px-4 py-3 border-t border-white/10">
                <p className="text-[12px] text-text-tertiary text-center">
                  💾 대화 기록은 이 기기에만 저장돼요 (서버 X)
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 상태 수정 모달 ── */}
      <AnimatePresence>
        {statusModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStatusModalOpen(false)}
              className="fixed inset-0 z-[80] bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[81] w-[min(420px,calc(100vw-32px))] bg-[rgba(20,12,38,0.98)] border border-white/15 rounded-2xl p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[16px] font-bold text-text-primary">현재 상태 수정</p>
                  <p className="text-[13px] text-text-tertiary mt-0.5">답변 개인화를 위한 참고 정보</p>
                </div>
                <button
                  onClick={() => setStatusModalOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>

              {/* 연애상태 */}
              <div className="mb-4">
                <p className="text-[13px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">연애상태</p>
                <div className="flex flex-wrap gap-1.5">
                  {RELATIONSHIP_PRESETS.map(r => (
                    <button
                      key={r}
                      onClick={() => setRelationshipSelect(r)}
                      className={`px-3 py-1.5 rounded-full text-[14px] font-medium border transition-all
                        ${relationshipSelect === r ? 'bg-cta/25 border-cta/60 text-cta' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {relationshipSelect === '기타' && (
                  <input
                    type="text"
                    value={customRelationship}
                    onChange={e => setCustomRelationship(e.target.value)}
                    placeholder="직접 입력 (예: 장거리 연애중)"
                    maxLength={30}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-text-primary text-[15px] placeholder-text-tertiary focus:border-cta/50 focus:outline-none"
                  />
                )}
              </div>

              {/* 직업 */}
              <div className="mb-5">
                <p className="text-[13px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">직업 / 일</p>
                <input
                  type="text"
                  value={jobInput}
                  onChange={e => setJobInput(e.target.value)}
                  placeholder="예: IT 회사 대표, 대학생, 취업 준비중"
                  maxLength={50}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-text-primary text-[15px] placeholder-text-tertiary focus:border-cta/50 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStatusModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-text-secondary font-medium text-[15px]"
                >
                  취소
                </button>
                <button
                  onClick={saveStatus}
                  className="flex-1 py-2.5 rounded-xl bg-cta text-white font-bold text-[15px]"
                >
                  저장
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
