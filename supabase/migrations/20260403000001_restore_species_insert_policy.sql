-- species INSERT 정책 복구 (2026-04-03)
-- species_insert_admin_only 삭제 후 기존 인증 사용자 허용 정책 복구

DROP POLICY IF EXISTS "species_insert_auth" ON species;

CREATE POLICY "species_insert_auth"
  ON species FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
