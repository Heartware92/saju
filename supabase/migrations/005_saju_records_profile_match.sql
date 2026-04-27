-- 보관함에서 "어떤 프로필의 풀이인지" 표시하기 위한 컬럼 추가
--
-- 기존: archiveSaju 가 항상 대표 프로필만 가져와 저장 → 친구·가족 사주를 봐도
--       모두 본인(대표 프로필) 정보로 잘못 기록되던 데이터 무결성 버그.
-- 수정 후: 풀이 페이지가 현재 보고 있는 profile_id 와 profile_name 을 명시 전달.
--
-- 컬럼 설계:
--   profile_id        — birth_profiles FK (nullable, 프로필 삭제 시 SET NULL 로 보존)
--   profile_name      — 저장 시점 프로필명 스냅샷 (프로필 이름 바뀌어도 풀이 시점 이름 유지)
--   partner_name      — 궁합 카테고리에서 상대방 이름 (스냅샷)
--   partner_birth_date— 궁합 카테고리에서 상대방 생일 (스냅샷)
--
-- 기존 데이터: 모든 컬럼 NULL 로 남아있고, 보관함 UI 에서는 "기록 시점 정보 없음"
--             또는 birth_date 로 fallback 표시. 강제 마이그레이션 없음.

ALTER TABLE saju_records
  ADD COLUMN IF NOT EXISTS profile_id        uuid REFERENCES birth_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS profile_name      text,
  ADD COLUMN IF NOT EXISTS partner_name      text,
  ADD COLUMN IF NOT EXISTS partner_birth_date date;

-- 빠른 조회용 인덱스 (사용자별 profile_id 별 그룹핑/필터)
CREATE INDEX IF NOT EXISTS saju_records_user_profile_idx
  ON saju_records (user_id, profile_id);
