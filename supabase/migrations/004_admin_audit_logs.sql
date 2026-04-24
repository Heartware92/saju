-- 004_admin_audit_logs.sql
-- 관리자 감사 로그 — 크레딧 조정·메모·차단·해제 등 모든 관리자 액션 기록
-- 악의적 관리자 추적 + 사고 대응 시 증거 확보용

create table if not exists public.admin_audit_logs (
  id               bigserial primary key,
  actor_user_id    uuid not null references auth.users(id) on delete restrict,
  actor_email      text not null,
  target_user_id   uuid references auth.users(id) on delete set null,
  target_email     text,
  action           text not null, -- 'credit_adjust' | 'note_update' | 'ban' | 'unban'
  credit_type      text,          -- 'sun' | 'moon' (action=credit_adjust 일 때)
  amount           integer,       -- 양수·음수 (action=credit_adjust 일 때)
  before_value     jsonb,         -- 조치 전 상태 (예: { balance: 10 })
  after_value      jsonb,         -- 조치 후 상태
  reason           text,          -- 사유 / 메모 내용 / ban 사유
  ip_address       inet,
  user_agent       text,
  created_at       timestamptz not null default now()
);

create index if not exists admin_audit_logs_actor_idx on public.admin_audit_logs(actor_user_id, created_at desc);
create index if not exists admin_audit_logs_target_idx on public.admin_audit_logs(target_user_id, created_at desc);
create index if not exists admin_audit_logs_action_idx on public.admin_audit_logs(action, created_at desc);
create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs(created_at desc);

-- RLS: service_role 만 읽기·쓰기 (어드민 API 서버에서만 접근)
alter table public.admin_audit_logs enable row level security;

-- 기본적으로 모든 일반 사용자 접근 차단. service_role 은 RLS 우회.
create policy "admin_audit_logs_no_user_access"
  on public.admin_audit_logs
  for all
  to authenticated
  using (false)
  with check (false);

comment on table public.admin_audit_logs is
  '관리자 감사 로그 — 크레딧 조정·메모·차단 등 모든 어드민 액션 기록';
comment on column public.admin_audit_logs.action is
  'credit_adjust: 크레딧 수동 조정 / note_update: 관리자 메모 변경 / ban: 계정 차단 / unban: 차단 해제';
