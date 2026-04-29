-- 회원 탈퇴 로그 — 사용자 탈퇴 후에도 운영자가 사유·시점 추적할 수 있도록
-- (사용자 데이터는 auth.users CASCADE 로 삭제되지만, 이 로그는 통계·감사용으로 보존)
--
-- 규제 근거: 정보통신망법 등 — 탈퇴 사유 통계는 보유 가능 (개인정보 분리).
-- 개인 식별 가능 정보(email)는 운영 추적용으로 보관, 30일 후 익명화 권장.

CREATE TABLE IF NOT EXISTS account_deletion_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,                      -- 탈퇴 시점 user.id (FK X — 사용자 삭제됨)
  email       text NOT NULL,                      -- 탈퇴 시점 이메일 (감사·문의 대응)
  reason      text,                               -- 사용자 입력 사유 (선택)
  reason_code text,                               -- 사유 카테고리 ('not_useful'|'too_expensive'|'privacy'|'other'|null)
  metadata    jsonb DEFAULT '{}'::jsonb,          -- 추가 컨텍스트 (가입일·총 결제·잔여 크레딧 스냅샷 등)
  deleted_at  timestamptz NOT NULL DEFAULT now()
);

-- 운영자 조회용 인덱스 — 최근 탈퇴 우선
CREATE INDEX IF NOT EXISTS idx_account_deletion_logs_deleted_at
  ON account_deletion_logs (deleted_at DESC);

-- email 인덱스 — 특정 사용자 추적용
CREATE INDEX IF NOT EXISTS idx_account_deletion_logs_email
  ON account_deletion_logs (email);

-- RLS — 일반 사용자는 본인 로그도 못 봄. 어드민 전용
ALTER TABLE account_deletion_logs ENABLE ROW LEVEL SECURITY;

-- 어드민(service_role) 만 조회·INSERT 가능
-- (탈퇴 시 사용자 본인의 마지막 액션이지만 service_role 키로 INSERT 하므로 별도 user 정책 불필요)
DROP POLICY IF EXISTS "service role full access" ON account_deletion_logs;
CREATE POLICY "service role full access"
  ON account_deletion_logs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE account_deletion_logs IS '회원 탈퇴 로그 — 통계·감사용 (사용자 데이터는 auth.users CASCADE 로 삭제됨)';
COMMENT ON COLUMN account_deletion_logs.user_id IS '탈퇴 시점 user.id (auth.users 삭제로 dangling)';
COMMENT ON COLUMN account_deletion_logs.reason IS '사용자 자유 입력 사유 (선택)';
COMMENT ON COLUMN account_deletion_logs.reason_code IS 'not_useful | too_expensive | privacy | hard_to_use | other';
