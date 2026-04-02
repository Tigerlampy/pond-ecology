-- ============================================================
-- 명예의 전당 RLS 우회 수정 (2026-04-02)
-- 문제: public_ranking 뷰가 SECURITY INVOKER(기본값)라서
--       profiles_select_own RLS에 의해 자기 자신만 조회됨
-- 해결: SECURITY DEFINER 함수로 대체 → postgres 권한으로 RLS 우회
-- ============================================================

CREATE OR REPLACE FUNCTION get_public_ranking()
RETURNS TABLE(display_name text, points integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT display_name, points
  FROM profiles
  ORDER BY points DESC;
$$;

GRANT EXECUTE ON FUNCTION get_public_ranking() TO anon, authenticated;
