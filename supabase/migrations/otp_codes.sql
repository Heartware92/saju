-- OTP 인증 코드 테이블
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 조회 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_code ON otp_codes (phone, code, verified);

-- 만료된 코드 자동 정리 (30일 이상 된 레코드 삭제용 — 필요시 cron 설정)
-- Supabase pg_cron 확장이 활성화되어 있으면 아래 주석 해제
-- SELECT cron.schedule('cleanup-otp-codes', '0 3 * * *', $$DELETE FROM otp_codes WHERE created_at < NOW() - INTERVAL '30 days'$$);
