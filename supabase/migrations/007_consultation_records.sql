-- ============================================
-- 상담소 대화 기록 테이블
-- localStorage 전용이던 상담 기록을 DB에도 저장하여
-- 관리자가 어드민에서 조회할 수 있도록 함
-- ============================================

create table if not exists consultation_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  profile_id uuid references birth_profiles(id) on delete set null,
  profile_name text,
  conversation_id text not null,
  title text not null default '새 대화',
  messages jsonb not null default '[]'::jsonb,
  message_count int not null default 0,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 인덱스
create index if not exists idx_consultation_records_user_id on consultation_records(user_id);
create index if not exists idx_consultation_records_profile_id on consultation_records(profile_id);
create index if not exists idx_consultation_records_updated_at on consultation_records(updated_at desc);
create unique index if not exists idx_consultation_records_user_conv on consultation_records(user_id, conversation_id);

-- RLS
alter table consultation_records enable row level security;

create policy "Users can view own consultation records"
  on consultation_records for select
  using (auth.uid() = user_id);

create policy "Users can insert own consultation records"
  on consultation_records for insert
  with check (auth.uid() = user_id);

create policy "Users can update own consultation records"
  on consultation_records for update
  using (auth.uid() = user_id);

-- updated_at 자동 갱신
create trigger consultation_records_updated_at
  before update on consultation_records
  for each row execute function update_updated_at();
