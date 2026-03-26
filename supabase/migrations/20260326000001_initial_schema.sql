-- profiles (학생 프로필)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL,
  grade INTEGER,
  class TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- species (생물 종 도감)
CREATE TABLE species (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ko TEXT NOT NULL,
  name_scientific TEXT,
  category TEXT NOT NULL CHECK (category IN ('어류','양서류','곤충','식물','조류','기타')),
  description TEXT,
  habitat TEXT,
  image_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- observations (관측 기록)
CREATE TABLE observations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  species_id UUID REFERENCES species(id) ON DELETE CASCADE NOT NULL,
  observer_id UUID REFERENCES profiles(id) NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  season TEXT NOT NULL CHECK (season IN ('봄','여름','가을','겨울')),
  location TEXT,
  count INTEGER DEFAULT 1 CHECK (count > 0),
  notes TEXT,
  image_url TEXT,
  weather TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE species ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

-- profiles RLS
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- species RLS
CREATE POLICY "species_select_all" ON species FOR SELECT USING (true);
CREATE POLICY "species_insert_auth" ON species FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "species_update_own" ON species FOR UPDATE USING (auth.uid() = created_by);

-- observations RLS
CREATE POLICY "observations_select_all" ON observations FOR SELECT USING (true);
CREATE POLICY "observations_insert_auth" ON observations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "observations_delete_own" ON observations FOR DELETE USING (auth.uid() = observer_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER species_updated_at
  BEFORE UPDATE ON species
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 신규 유저 자동 프로필 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
