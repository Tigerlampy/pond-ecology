-- Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public) VALUES
  ('species-images', 'species-images', true),
  ('observation-images', 'observation-images', true);

-- species-images 정책
CREATE POLICY "species_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'species-images');
CREATE POLICY "species_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'species-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "species_images_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'species-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- observation-images 정책
CREATE POLICY "obs_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'observation-images');
CREATE POLICY "obs_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'observation-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "obs_images_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'observation-images' AND auth.uid()::text = (storage.foldername(name))[1]);
