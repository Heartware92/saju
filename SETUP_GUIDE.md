# 🚀 사주 운세 웹 서비스 설정 가이드

## 📋 체크리스트

Phase 5 완료를 위한 체크리스트:

- [ ] Supabase 프로젝트 생성 & DB 설정
- [ ] PortOne 계정 생성 & 인증키 발급
- [ ] 환경 변수 설정
- [ ] 로컬 빌드 테스트
- [ ] 로컬 실행 테스트
- [ ] Vercel 배포 (선택)

---

## 1️⃣ Supabase 설정

### 1.1 Supabase 프로젝트 생성

1. **Supabase 접속**: https://supabase.com/
2. **Sign Up** 또는 **Login** (GitHub 계정으로 가능)
3. **New Project** 클릭
   - Organization: 기존 또는 새로 생성
   - Name: `saju-web` (원하는 이름)
   - Database Password: 강력한 비밀번호 설정
   - Region: `Northeast Asia (Seoul)` 선택 (가장 가까운 지역)
   - Pricing Plan: `Free` (시작용)
4. **Create new project** 클릭 (약 2분 소요)

### 1.2 Database 스키마 생성

1. 왼쪽 메뉴 → **SQL Editor** 클릭
2. **New query** 클릭
3. 아래 SQL 전체 복사 & 실행 (Run 버튼):

```sql
-- ===================================
-- 사주 웹 서비스 Database Schema
-- ===================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- 1. 크레딧 테이블
-- ===================================

-- 사용자 크레딧 잔액
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  total_purchased INTEGER DEFAULT 0,
  total_consumed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 크레딧 거래 내역
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('purchase', 'consume', 'bonus', 'refund')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT,
  order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 2. 주문 테이블
-- ===================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  credit_amount INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  payment_method TEXT,
  payment_key TEXT,
  portone_payment_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ===================================
-- 3. 사주 분석 기록
-- ===================================

CREATE TABLE saju_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_date TIMESTAMP WITH TIME ZONE NOT NULL,
  birth_place TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  result_data JSONB NOT NULL,
  interpretation_basic TEXT,
  interpretation_detailed TEXT,
  credit_used INTEGER DEFAULT 0,
  is_detailed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 4. 타로 기록
-- ===================================

CREATE TABLE tarot_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  spread_type TEXT NOT NULL,
  cards JSONB NOT NULL,
  question TEXT,
  interpretation TEXT,
  credit_used INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 5. 인덱스 생성
-- ===================================

CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_saju_records_user_id ON saju_records(user_id);
CREATE INDEX idx_saju_records_created_at ON saju_records(created_at DESC);
CREATE INDEX idx_tarot_records_user_id ON tarot_records(user_id);
CREATE INDEX idx_tarot_records_created_at ON tarot_records(created_at DESC);

-- ===================================
-- 6. RLS (Row Level Security) 정책
-- ===================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE saju_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarot_records ENABLE ROW LEVEL SECURITY;

-- user_credits 정책
CREATE POLICY "Users can view own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
  ON user_credits FOR UPDATE
  USING (auth.uid() = user_id);

-- credit_transactions 정책
CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- orders 정책
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

-- saju_records 정책
CREATE POLICY "Users can view own saju records"
  ON saju_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saju records"
  ON saju_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- tarot_records 정책
CREATE POLICY "Users can view own tarot records"
  ON tarot_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tarot records"
  ON tarot_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ===================================
-- 7. Database Trigger (회원가입 시 무료 엽전)
-- ===================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 신규 가입자에게 1엽전 무료 제공
  INSERT INTO user_credits (user_id, balance, total_purchased)
  VALUES (NEW.id, 1, 0);

  -- 보너스 크레딧 거래 기록
  INSERT INTO credit_transactions (user_id, type, amount, balance_after, reason)
  VALUES (NEW.id, 'bonus', 1, 1, '회원가입 축하 무료 엽전');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===================================
-- 완료!
-- ===================================
```

4. **Run** 버튼 클릭하여 실행
5. 성공 메시지 확인

### 1.3 API Keys 복사

1. 왼쪽 메뉴 → **Project Settings** (톱니바퀴 아이콘)
2. **API** 탭 클릭
3. 다음 값들을 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. `.env` 파일에 입력:
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.4 Authentication 설정 (선택사항)

1. 왼쪽 메뉴 → **Authentication**
2. **Providers** 탭
3. **Email** 활성화 확인 (기본 활성화됨)
4. 소셜 로그인 추가 (선택):
   - Google
   - GitHub
   - 각 Provider 설정 필요

---

## 2️⃣ PortOne (포트원) 설정

### 2.1 PortOne 가입

1. **PortOne 접속**: https://portone.io/
2. **회원가입** 또는 **로그인**
3. **신규 가맹점 등록**

### 2.2 채널 설정

1. **결제 연동** → **채널 관리**
2. **테스트 채널 추가**
   - PG사: 원하는 PG사 선택 (예: KG이니시스, 토스페이먼츠)
   - 채널명: `테스트 채널`
   - 테스트 모드 활성화
3. **저장**

### 2.3 API Keys 복사

1. **개발자센터** → **API Keys**
2. 다음 값들을 복사:
   - **Store ID**: `store-xxxxx`
   - **Channel Key**: `channel-key-xxxxx`

3. `.env` 파일에 입력:
```bash
VITE_PORTONE_STORE_ID=store-xxxxx
VITE_PORTONE_CHANNEL_KEY=channel-key-xxxxx
```

### 2.4 Webhook 설정 (배포 후)

배포 후 Webhook URL 설정:
- URL: `https://your-domain.vercel.app/api/payment/webhook`
- 이벤트: `payment.paid`, `payment.failed`

---

## 3️⃣ 환경 변수 최종 확인

`.env` 파일이 다음과 같이 채워졌는지 확인:

```bash
# OpenAI
VITE_OPENAI_API_KEY=sk-proj-xxxxx

# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# PortOne
VITE_PORTONE_STORE_ID=store-xxxxx
VITE_PORTONE_CHANNEL_KEY=channel-key-xxxxx

# Base URL
VITE_BASE_URL=http://localhost:5173
```

---

## 4️⃣ 로컬 테스트

### 4.1 의존성 설치 확인

```bash
npm install
```

### 4.2 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

### 4.3 테스트 시나리오

#### 테스트 1: 회원가입
1. `/signup` 페이지 접속
2. 이메일/비밀번호 입력
3. 회원가입 완료
4. ✅ Header에 "1 엽전" 표시 확인

#### 테스트 2: 사주 분석 (무료)
1. `/saju` 페이지 접속
2. 생년월일시 입력
3. 결과 확인
4. ✅ 원국표, 오행 분포, 기본 해석 표시

#### 테스트 3: Paywall (상세 해석)
1. "대운·세운" 탭 클릭
2. ✅ Paywall 모달 노출
3. "잠금 해제" 클릭
4. ✅ 크레딧 부족 시 `/credit` 페이지 이동

#### 테스트 4: 결제 (테스트 모드)
1. `/credit` 페이지 접속
2. 패키지 선택 (예: 중인)
3. ✅ 포트원 결제창 오픈
4. 테스트 카드 정보 입력
5. ✅ 결제 완료 후 크레딧 증가 확인

#### 테스트 5: 마이페이지
1. `/mypage` 접속
2. ✅ 프로필, 크레딧, 거래내역 확인

---

## 5️⃣ 빌드 테스트

```bash
npm run build
```

에러 없이 빌드 완료되는지 확인

---

## 6️⃣ Vercel 배포 (선택)

### 6.1 Vercel CLI 설치

```bash
npm install -g vercel
```

### 6.2 배포

```bash
vercel
```

프롬프트에 따라 진행:
- Project name: `saju-web`
- Framework: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

### 6.3 환경 변수 설정

Vercel 대시보드에서:
1. **Settings** → **Environment Variables**
2. `.env.production` 내용 추가

### 6.4 Production 배포

```bash
vercel --prod
```

---

## ✅ 완료 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] Database 스키마 실행 완료
- [ ] Supabase API Keys 복사 완료
- [ ] PortOne 가입 완료
- [ ] PortOne API Keys 복사 완료
- [ ] `.env` 파일 작성 완료
- [ ] `npm run dev` 실행 성공
- [ ] 회원가입 테스트 통과
- [ ] 무료 사주 분석 테스트 통과
- [ ] Paywall 모달 테스트 통과
- [ ] 결제 플로우 테스트 통과 (테스트 모드)
- [ ] `npm run build` 성공
- [ ] Vercel 배포 완료 (선택)

---

## 🆘 트러블슈팅

### Supabase 연결 오류
- API Keys 재확인
- RLS 정책 확인
- Network 탭에서 401/403 에러 확인

### PortOne 결제창 안 뜸
- Store ID / Channel Key 재확인
- 브라우저 팝업 차단 해제
- 테스트 모드 활성화 확인

### 빌드 오류
```bash
npm run build -- --debug
```
로그 확인 후 오류 수정

---

## 📞 문의

- **Supabase 문서**: https://supabase.com/docs
- **PortOne 문서**: https://portone.gitbook.io/docs
- **Vercel 문서**: https://vercel.com/docs

---

**준비되셨나요? 환경 변수를 설정하고 로컬 테스트를 시작해보세요!**
