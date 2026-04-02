-- ============================================================
-- 포인트 트리거 SECURITY DEFINER 수정 (2026-04-02)
-- 문제: 포인트 트리거가 SECURITY INVOKER로 동작하면
--       profiles_update_own RLS WITH CHECK (points 변경 금지)에 막혀
--       species/observations INSERT가 롤백됨
-- 해결: 포인트 적립 트리거 함수를 SECURITY DEFINER로 재생성
-- ============================================================

-- species 등록 시 +10pt
CREATE OR REPLACE FUNCTION add_points_on_species()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET points = points + 10 WHERE id = NEW.created_by;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS species_points ON species;
CREATE TRIGGER species_points
  AFTER INSERT ON species
  FOR EACH ROW EXECUTE FUNCTION add_points_on_species();

-- 관측 기록 추가 시 +5pt
CREATE OR REPLACE FUNCTION add_points_on_observation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET points = points + 5 WHERE id = NEW.observer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS observation_points ON observations;
CREATE TRIGGER observation_points
  AFTER INSERT ON observations
  FOR EACH ROW EXECUTE FUNCTION add_points_on_observation();
