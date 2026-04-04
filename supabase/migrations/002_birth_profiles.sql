-- ============================================
-- Birth Profiles: 사주 프로필 (가족/친구 등)
-- 한 유저가 여러 명의 생년월일을 저장
-- ============================================

create table if not exists birth_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,                    -- 프로필 이름 (예: "나", "엄마", "친구 민수")
  relation text,                         -- 관계 (self, parent, sibling, friend, partner, child, other)
  birth_date text not null,              -- 생년월일 (YYYY-MM-DD)
  birth_time text,                       -- 출생시간 (HH:mm), null이면 시간 모름
  birth_place text default 'seoul',      -- 출생지 key (CITY_COORDINATES 키값)
  gender text not null check (gender in ('male', 'female')),
  calendar_type text not null default 'solar' check (calendar_type in ('solar', 'lunar')),
  is_primary boolean not null default false,  -- 본인 프로필 여부
  memo text,                             -- 메모
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_birth_profiles_user_id on birth_profiles(user_id);

-- RLS
alter table birth_profiles enable row level security;

create policy "Users can view own profiles"
  on birth_profiles for select
  using (auth.uid() = user_id);

create policy "Users can create own profiles"
  on birth_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profiles"
  on birth_profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete own profiles"
  on birth_profiles for delete
  using (auth.uid() = user_id);

-- updated_at trigger
create trigger birth_profiles_updated_at
  before update on birth_profiles
  for each row execute function update_updated_at();
