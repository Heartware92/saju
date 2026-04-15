-- 진태양시 보정을 위한 출생지 경도 컬럼 추가
-- birth_place(문자열 코드) 만으로는 해외/소도시 커버 불가 → 실측 경도 저장

alter table public.birth_profiles
  add column if not exists longitude numeric(8, 5);

comment on column public.birth_profiles.longitude is
  '출생지 경도 (동경 양수, 서경 음수). null 이면 birth_place 코드 조회 후 서울 기본값 사용.';

-- 인덱스 불필요 (조회 조건 아님)
