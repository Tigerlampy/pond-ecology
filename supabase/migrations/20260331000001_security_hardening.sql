-- ============================================================
-- 보안 강화 마이그레이션 (2026-03-31)
-- 모의해킹 보고서 대응: VULN-02, VULN-04, VULN-05, VULN-07
-- ============================================================


-- ============================================================
-- VULN-02: profiles 개인정보 보호 (학생 실명/학번 무인증 노출 차단)
-- ============================================================

-- 기존 전체 공개 정책 제거
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;

-- 본인 프로필만 직접 조회 가능 (인증된 사용자)
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 랭킹용 공개 뷰: 이름 + 포인트만 공개 (학번/UUID 제외)
CREATE OR REPLACE VIEW public_ranking AS
  SELECT display_name, points
  FROM profiles
  ORDER BY points DESC;

GRANT SELECT ON public_ranking TO anon, authenticated;


-- ============================================================
-- VULN-07: 포인트/학번 직접 조작 차단
-- ============================================================

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- 본인 프로필 수정 허용하되 points, student_number 변경 불가
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    points = (SELECT points FROM profiles WHERE id = auth.uid())
    AND student_number = (SELECT student_number FROM profiles WHERE id = auth.uid())
  );


-- ============================================================
-- VULN-04: 이메일 인증 활성화로 대응 (Supabase Dashboard에서 설정)
-- species INSERT는 인증된 학생 모두 허용 유지 (기존 정책 그대로)
-- 이메일 인증을 켜면 임의 계정 생성이 차단되어 공격 경로가 끊김
-- ============================================================
-- (별도 SQL 변경 없음 — Dashboard 설정으로 처리)


-- ============================================================
-- VULN-05: XSS 방어 — 입력값 HTML 태그 제거 트리거
-- ============================================================

-- species 테이블 sanitize
CREATE OR REPLACE FUNCTION sanitize_species_input()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name_ko         := regexp_replace(COALESCE(NEW.name_ko, ''), '<[^>]*>', '', 'g');
  NEW.name_scientific := regexp_replace(COALESCE(NEW.name_scientific, ''), '<[^>]*>', '', 'g');
  NEW.description     := regexp_replace(COALESCE(NEW.description, ''), '<[^>]*>', '', 'g');
  NEW.habitat         := regexp_replace(COALESCE(NEW.habitat, ''), '<[^>]*>', '', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sanitize_species ON species;
CREATE TRIGGER sanitize_species
  BEFORE INSERT OR UPDATE ON species
  FOR EACH ROW EXECUTE FUNCTION sanitize_species_input();

-- observations 테이블 sanitize
CREATE OR REPLACE FUNCTION sanitize_observation_input()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := regexp_replace(COALESCE(NEW.location, ''), '<[^>]*>', '', 'g');
  NEW.notes    := regexp_replace(COALESCE(NEW.notes, ''), '<[^>]*>', '', 'g');
  NEW.weather  := regexp_replace(COALESCE(NEW.weather, ''), '<[^>]*>', '', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sanitize_observations ON observations;
CREATE TRIGGER sanitize_observations
  BEFORE INSERT OR UPDATE ON observations
  FOR EACH ROW EXECUTE FUNCTION sanitize_observation_input();
