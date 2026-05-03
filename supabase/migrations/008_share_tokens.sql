-- 공유 토큰: 결과 페이지를 외부에 공개 링크로 공유하기 위한 컬럼
ALTER TABLE saju_records
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE;

ALTER TABLE tarot_records
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS saju_records_share_token_idx
  ON saju_records (share_token) WHERE share_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tarot_records_share_token_idx
  ON tarot_records (share_token) WHERE share_token IS NOT NULL;
