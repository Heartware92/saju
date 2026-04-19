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

const MOON_COST_PER_QUESTION = 1;

// ──────────────────────────────────────────────
// 타입·상수
// ──────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
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
const HISTORY_KEY = (profileId: string) => `sangdamso:history:${profileId}`;

// ──────────────────────────────────────────────
// 컴포넌트
// ──────────────────────────────────────────────
export default function ConsultationPage() {
  const { user } = useUserStore();
  const { profiles, fetchProfiles } = useProfileStore();
  const { moonBalance, consumeCredit, fetchBalance } = useCreditStore();

  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [status, setStatus] = useState<ConsultationStatus>({});
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [jobInput, setJobInput] = useState('');
  const [relationshipSelect, setRelationshipSelect] = useState('');
  const [customRelationship, setCustomRelationship] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 초기화: 프로필 불러오기
  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchBalance();
    }
  }, [user, fetchProfiles, fetchBalance]);

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

  // 프로필 전환 시: 상태·히스토리 로드 (진행 중 응답이 엉뚱한 프로필에 꽂히지 않도록 로딩 리셋)
  useEffect(() => {
    if (!selectedProfileId) return;
    if (typeof window === 'undefined') return;

    // 진행 중 로딩/에러 리셋
    setLoading(false);
    setError('');

    // 상태 로드
    try {
      const raw = localStorage.getItem(STATUS_KEY(selectedProfileId));
      if (raw) {
        const parsed = JSON.parse(raw);
        setStatus(parsed);
      } else {
        setStatus({});
      }
    } catch {
      setStatus({});
    }

    // 히스토리 로드
    try {
      const raw = localStorage.getItem(HISTORY_KEY(selectedProfileId));
      if (raw) {
        setMessages(JSON.parse(raw));
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }
  }, [selectedProfileId]);

  // 히스토리 자동 저장
  useEffect(() => {
    if (!selectedProfileId) return;
    try {
      localStorage.setItem(HISTORY_KEY(selectedProfileId), JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages, selectedProfileId]);

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

    // 크레딧 체크
    if (moonBalance < MOON_COST_PER_QUESTION) {
      setError('달 크레딧이 부족해요. 크레딧을 충전해주세요.');
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

      // 응답 성공 후 크레딧 차감
      const consumed = await consumeCredit('moon', MOON_COST_PER_QUESTION, `상담소:${question.slice(0, 20)}`);
      if (!consumed) {
        console.error('크레딧 차감 실패 (응답은 이미 생성됨)');
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

  const handleClearHistory = () => {
    if (!confirm('대화 기록을 모두 삭제할까요?')) return;
    setMessages([]);
    if (selectedProfileId) {
      try { localStorage.removeItem(HISTORY_KEY(selectedProfileId)); } catch { /* ignore */ }
    }
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
        <Link href="/login" className="text-cta font-semibold underline">로그인하기</Link>
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
            <p className="text-[11px] text-text-tertiary mt-0.5">사주 기반 1:1 AI 상담 · 1회 🌙 {MOON_COST_PER_QUESTION}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-[11px] text-text-tertiary hover:text-text-secondary px-2 py-1"
                title="대화 기록 초기화"
              >
                기록 지우기
              </button>
            )}
          </div>
        </div>

        {/* 프로필 선택 탭 */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProfileId(p.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all
                ${selectedProfileId === p.id ? 'bg-cta/20 border-cta/50 text-cta' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* 상태 요약 + 수정 */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-wrap gap-1.5 text-[10px]">
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
            className="text-[11px] text-cta hover:text-cta/80 font-medium"
          >
            상태 수정 ✎
          </button>
        </div>
      </div>

      {/* ── 메시지 영역 ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* 웰컴 메시지 */}
        {showWelcome && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-[rgba(20,12,38,0.65)] border border-[var(--border-subtle)] rounded-2xl p-4 mb-4">
              <p className="text-[14px] text-text-primary leading-relaxed">
                안녕하세요, <span className="font-bold text-cta">{selectedProfile.name}님</span>. 상담소에 오신 것을 환영해요.
              </p>
              <p className="text-[13px] text-text-secondary leading-relaxed mt-2">
                재물운·연애운·건강운 무엇이든 편하게 물어보세요. {selectedProfile.name}님의 사주를 바탕으로 맞춤 답변을 드려요.
              </p>
              <p className="text-[11px] text-text-tertiary mt-3">
                💡 더 정확한 답변을 위해 상단의 <span className="text-cta">상태 수정</span>에서 연애상태와 직업을 입력해보세요.
              </p>
            </div>

            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-1">
              이런 질문을 많이 해요
            </p>
            <div className="flex flex-col gap-2">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  className="text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[13px] text-text-secondary hover:border-cta/40 hover:text-text-primary transition-all disabled:opacity-40"
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
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/40 to-indigo-500/30 flex items-center justify-center text-sm mr-2 border border-white/15">
                    🌙
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-[14px] leading-[1.75] whitespace-pre-wrap
                    ${msg.role === 'user'
                      ? 'bg-cta/90 text-white rounded-tr-sm'
                      : 'bg-[rgba(20,12,38,0.75)] border border-[var(--border-subtle)] text-text-primary rounded-tl-sm'}`}
                >
                  {msg.content}
                  {isStreaming && (
                    <span className="inline-block w-[8px] h-[14px] bg-cta/80 ml-0.5 -mb-0.5 align-middle animate-pulse" />
                  )}
                </div>
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
                <span className="text-[12px] text-text-secondary ml-1">사주 데이터를 엮는 중...</span>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-[13px] text-red-400 text-center">
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
            className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-text-primary text-[14px] placeholder-text-tertiary focus:border-cta/50 focus:outline-none resize-none transition disabled:opacity-60"
            style={{ maxHeight: '100px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading || moonBalance < MOON_COST_PER_QUESTION}
            className="flex-shrink-0 w-11 h-11 rounded-full bg-cta text-white flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="전송"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22,2 15,22 11,13 2,9 22,2" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[10px] text-text-tertiary">{inputText.length}/300</span>
          <span className="text-[10px] text-text-tertiary">
            보유 🌙 {moonBalance} · 1회 🌙 {MOON_COST_PER_QUESTION}
          </span>
        </div>
      </div>

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
                  <p className="text-[11px] text-text-tertiary mt-0.5">답변 개인화를 위한 참고 정보</p>
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
                <p className="text-[11px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">연애상태</p>
                <div className="flex flex-wrap gap-1.5">
                  {RELATIONSHIP_PRESETS.map(r => (
                    <button
                      key={r}
                      onClick={() => setRelationshipSelect(r)}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all
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
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-text-primary text-[13px] placeholder-text-tertiary focus:border-cta/50 focus:outline-none"
                  />
                )}
              </div>

              {/* 직업 */}
              <div className="mb-5">
                <p className="text-[11px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">직업 / 일</p>
                <input
                  type="text"
                  value={jobInput}
                  onChange={e => setJobInput(e.target.value)}
                  placeholder="예: IT 회사 대표, 대학생, 취업 준비중"
                  maxLength={50}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-text-primary text-[13px] placeholder-text-tertiary focus:border-cta/50 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStatusModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-text-secondary font-medium text-[13px]"
                >
                  취소
                </button>
                <button
                  onClick={saveStatus}
                  className="flex-1 py-2.5 rounded-xl bg-cta text-white font-bold text-[13px]"
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
