# 사주풀이 백엔드 설정 및 배포 가이드

## 📋 목차
1. [Supabase 백엔드 설정](#1-supabase-백엔드-설정)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [PortOne 결제 설정](#3-portone-결제-설정)
4. [Vercel 배포](#4-vercel-배포)

---

## 1. Supabase 백엔드 설정

### 1.1 Supabase 프로젝트 생성
1. https://supabase.com 접속
2. **New Project** 클릭
3. 프로젝트 정보 입력:
   - **Name**: `saju-app`
   - **Database Password**: 안전한 비밀번호 생성 (저장 필수!)
   - **Region**: Northeast Asia (Seoul) - 한국 서버
4. **Create new project** 클릭 (약 2분 소요)

### 1.2 데이터베이스 테이블 생성

Supabase Dashboard → **SQL Editor** → **New query**에 아래 SQL 전체 복사/붙여넣기 후 실행:

```sql
-- ============================================
-- 사주풀이 데이터베이스 스키마
-- ============================================

-- 1. 사용자 크레딧 테이블
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance INTEGER DEFAULT 0 NOT NULL CHECK (balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. 크레딧 거래 내역 테이블
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. 주문 테이블
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  credit_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_key TEXT,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 4. 사주 기록 테이블
CREATE TABLE saju_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  birth_info JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. 타로 기록 테이블
CREATE TABLE tarot_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  spread_type TEXT NOT NULL,
  question TEXT,
  cards JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_saju_records_user_id ON saju_records(user_id);
CREATE INDEX idx_tarot_records_user_id ON tarot_records(user_id);

-- ============================================
-- RLS (Row Level Security) 정책 설정
-- ============================================

-- user_credits
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credits" ON user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON user_credits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credits" ON user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- credit_transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);

-- saju_records
ALTER TABLE saju_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saju records" ON saju_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saju records" ON saju_records FOR INSERT WITH CHECK (auth.uid() = user_id);

-- tarot_records
ALTER TABLE tarot_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tarot records" ON tarot_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tarot records" ON tarot_records FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 트리거: user_credits 자동 생성
-- ============================================
CREATE OR REPLACE FUNCTION create_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_credits();
```

### 1.3 API Keys 확인
Supabase Dashboard → **Settings** → **API**:
- **Project URL**: `https://xxxxx.supabase.co` (복사)
- **anon public**: `eyJhbG...` (복사)

---

## 2. 환경 변수 설정

### 2.1 로컬 개발용 (.env)
`.env` 파일 생성 후 아래 내용 작성:

```env
# OpenAI API (사주풀이 AI 해석용)
VITE_OPENAI_API_KEY=sk-proj-your-openai-api-key

# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# PortOne (결제)
VITE_PORTONE_STORE_ID=store-xxxxxxxx
VITE_PORTONE_CHANNEL_KEY=channel-key-xxxxxxxx

# Base URL
VITE_BASE_URL=http://localhost:5173
```

### 2.2 프로덕션용 (.env.production)
```env
VITE_OPENAI_API_KEY=sk-proj-your-production-key
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_PORTONE_STORE_ID=store-xxxxxxxx
VITE_PORTONE_CHANNEL_KEY=channel-key-xxxxxxxx
VITE_BASE_URL=https://saju.yourdomain.com
```

---

## 3. PortOne 결제 설정

### 3.1 PortOne 가입
1. https://portone.io 접속
2. **무료로 시작하기** → 회원가입
3. 사업자 정보 입력 (개인사업자/법인)

### 3.2 채널 생성
1. **결제 연동** → **채널 관리**
2. **새 채널 추가**
3. PG사 선택:
   - **토스페이먼츠** (권장) 또는
   - **KG이니시스**
4. 테스트 모드로 먼저 설정
5. **채널 키** 복사 → `.env`의 `VITE_PORTONE_CHANNEL_KEY`에 붙여넣기

### 3.3 상점 ID 확인
1. **설정** → **내 식별코드**
2. **상점 ID** 복사 → `.env`의 `VITE_PORTONE_STORE_ID`에 붙여넣기

---

## 4. Vercel 배포

### 4.1 GitHub 연동 (선택사항)
```bash
# Git 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit"

# GitHub 레포지토리 생성 후
git remote add origin https://github.com/yourusername/saju-app.git
git push -u origin main
```

### 4.2 Vercel 배포

#### 방법 1: GitHub 연동 배포 (권장)
1. https://vercel.com 접속 → GitHub 로그인
2. **Add New** → **Project**
3. GitHub 레포지토리 선택 (`saju-app`)
4. **Framework Preset**: Vite 자동 감지됨
5. **Environment Variables** 클릭:
   ```
   VITE_OPENAI_API_KEY=sk-proj-...
   VITE_SUPABASE_URL=https://...
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_PORTONE_STORE_ID=store-...
   VITE_PORTONE_CHANNEL_KEY=channel-key-...
   VITE_BASE_URL=https://saju-app.vercel.app
   ```
6. **Deploy** 클릭!
7. 배포 완료 후 URL 확인: `https://saju-app.vercel.app`

#### 방법 2: Vercel CLI 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 첫 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 4.3 커스텀 도메인 설정 (선택)
1. Vercel Dashboard → 프로젝트 선택
2. **Settings** → **Domains**
3. **Add Domain** → `saju.yourdomain.com` 입력
4. DNS 설정 안내에 따라 CNAME 레코드 추가
5. SSL 자동 적용 (무료)

---

## 5. 배포 후 확인사항

### ✅ 체크리스트
- [ ] Supabase 테이블 모두 생성됨
- [ ] RLS 정책 활성화됨
- [ ] 회원가입 테스트 성공
- [ ] 로그인 테스트 성공
- [ ] 크레딧 구매 테스트 (테스트 모드)
- [ ] 사주풀이 실행 테스트
- [ ] 타로 실행 테스트
- [ ] Vercel 환경 변수 모두 설정됨
- [ ] HTTPS 적용 확인

---

## 6. 트러블슈팅

### 문제: "Invalid API key" 에러
**해결**: `.env` 파일의 API 키 확인, Vercel 환경 변수 재확인

### 문제: "CORS error"
**해결**: Supabase → **Settings** → **API** → **CORS**에 Vercel URL 추가

### 문제: 결제 실패
**해결**: PortOne 채널이 테스트 모드인지 확인, 카드번호는 테스트용 사용

---

## 📞 지원
- Supabase 문서: https://supabase.com/docs
- PortOne 문서: https://developers.portone.io
- Vercel 문서: https://vercel.com/docs

배포 완료! 🎉
