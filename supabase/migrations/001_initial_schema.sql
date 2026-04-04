-- ============================================
-- 사주 프로젝트 초기 스키마
-- 해(☀️)/달(🌙) 이중 크레딧 시스템
-- ============================================

-- 1. user_credits: 사용자 크레딧 잔액
create table if not exists user_credits (
  user_id uuid references auth.users on delete cascade primary key,
  sun_balance int not null default 0,
  moon_balance int not null default 0,
  total_sun_purchased int not null default 0,
  total_moon_purchased int not null default 0,
  total_sun_consumed int not null default 0,
  total_moon_consumed int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. credit_transactions: 크레딧 거래 내역
create table if not exists credit_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  credit_type text not null check (credit_type in ('sun', 'moon')),
  type text not null check (type in ('purchase', 'consume', 'bonus', 'refund')),
  amount int not null,
  balance_after int not null,
  reason text,
  order_id uuid,
  created_at timestamptz not null default now()
);

-- 3. orders: 결제 주문
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  package_id text not null,
  package_name text not null,
  amount int not null,
  sun_credit_amount int not null default 0,
  moon_credit_amount int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  payment_method text,
  payment_key text,
  portone_payment_id text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- 4. saju_records: 사주 분석 기록
create table if not exists saju_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  birth_date text not null,
  birth_time text,
  birth_place text,
  gender text not null check (gender in ('male', 'female')),
  calendar_type text not null default 'solar' check (calendar_type in ('solar', 'lunar')),
  category text not null default 'traditional',
  result_data jsonb not null,
  engine_result jsonb,
  interpretation_basic text,
  interpretation_detailed text,
  credit_type text check (credit_type in ('sun', 'moon')),
  credit_used int not null default 0,
  is_detailed boolean not null default false,
  created_at timestamptz not null default now()
);

-- 5. tarot_records: 타로 기록
create table if not exists tarot_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  spread_type text not null,
  cards jsonb not null,
  question text,
  interpretation text,
  credit_type text check (credit_type in ('sun', 'moon')),
  credit_used int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================
-- 인덱스
-- ============================================
create index if not exists idx_credit_transactions_user_id on credit_transactions(user_id);
create index if not exists idx_credit_transactions_created_at on credit_transactions(created_at desc);
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_saju_records_user_id on saju_records(user_id);
create index if not exists idx_saju_records_created_at on saju_records(created_at desc);
create index if not exists idx_tarot_records_user_id on tarot_records(user_id);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
alter table user_credits enable row level security;
alter table credit_transactions enable row level security;
alter table orders enable row level security;
alter table saju_records enable row level security;
alter table tarot_records enable row level security;

-- user_credits: 본인만 조회 가능
create policy "Users can view own credits"
  on user_credits for select
  using (auth.uid() = user_id);

-- credit_transactions: 본인만 조회 가능
create policy "Users can view own transactions"
  on credit_transactions for select
  using (auth.uid() = user_id);

-- orders: 본인만 조회/생성 가능
create policy "Users can view own orders"
  on orders for select
  using (auth.uid() = user_id);

create policy "Users can create own orders"
  on orders for insert
  with check (auth.uid() = user_id);

-- saju_records: 본인만 CRUD
create policy "Users can view own saju records"
  on saju_records for select
  using (auth.uid() = user_id);

create policy "Users can create own saju records"
  on saju_records for insert
  with check (auth.uid() = user_id);

-- tarot_records: 본인만 CRUD
create policy "Users can view own tarot records"
  on tarot_records for select
  using (auth.uid() = user_id);

create policy "Users can create own tarot records"
  on tarot_records for insert
  with check (auth.uid() = user_id);

-- ============================================
-- 트리거: 회원가입 시 크레딧 초기화 + 환영 보너스
-- ============================================
create or replace function handle_new_user()
returns trigger as $$
begin
  -- 크레딧 레코드 생성 (달 1개 환영 보너스)
  insert into user_credits (user_id, moon_balance)
  values (new.id, 1);

  -- 거래 내역 기록
  insert into credit_transactions (user_id, credit_type, type, amount, balance_after, reason)
  values (new.id, 'moon', 'bonus', 1, 1, '회원가입 환영 보너스 🌙');

  return new;
end;
$$ language plpgsql security definer;

-- 기존 트리거 제거 후 재생성
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================
-- 트리거: updated_at 자동 갱신
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_credits_updated_at
  before update on user_credits
  for each row execute function update_updated_at();
