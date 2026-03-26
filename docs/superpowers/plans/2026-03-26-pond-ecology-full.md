# 학교 연못 생태 도감 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 과학고 학교 연못 생물을 등록·식별·기록하는 웹 기반 생태 도감을 구축한다.

**Architecture:** Next.js App Router 기반 풀스택 앱. Supabase로 DB·스토리지·인증을 처리하고, Claude API를 서버 사이드 API Route에서만 호출해 종 식별과 설명 생성을 수행한다. 통계는 클라이언트에서 Recharts로 렌더링한다.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Supabase (PostgreSQL + Storage + Auth), Claude API (claude-sonnet-4-5), Recharts, Jest + Testing Library, Vercel

---

## CCR 라우팅 전략

개발 도구(Claude Code Router)에서 이 프로젝트를 작업할 때 권장 config:

```json
{
  "router": "mcp",
  "routes": {
    "think": {
      "model": "openrouter/anthropic/claude-opus-4",
      "description": "DB 스키마 설계, API 구조 기획, 복잡한 로직 추론"
    },
    "default": {
      "model": "openrouter/anthropic/claude-sonnet-4-5",
      "description": "컴포넌트 구현, API Route 코딩, 일반 개발"
    },
    "background": {
      "model": "openrouter/anthropic/claude-haiku-4-5",
      "description": "파일 스캔, 타입 생성, 보일러플레이트"
    },
    "longContext": {
      "model": "openrouter/anthropic/claude-sonnet-4-5",
      "description": "마이그레이션 전체 검토, 긴 로그 분석"
    }
  }
}
```

앱 내 Claude API 호출:
- 종 식별 (이미지 분석): `claude-sonnet-4-5` — 비전 + 비용 균형
- 설명 생성 (텍스트): `claude-haiku-4-5` — 단순 생성, 저비용

예상 개발 비용: ~$3–8 (Sonnet 위주 + Haiku background 혼합)

---

## 파일 구조

```
pond-ecology/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 (Header 포함)
│   ├── page.tsx                      # 홈 (도감 목록으로 redirect)
│   ├── (auth)/
│   │   ├── login/page.tsx            # 로그인
│   │   └── signup/page.tsx           # 회원가입
│   ├── species/
│   │   ├── page.tsx                  # 생물 목록
│   │   ├── new/page.tsx              # 생물 등록
│   │   └── [id]/page.tsx             # 생물 상세
│   ├── observations/
│   │   ├── page.tsx                  # 관측 기록 목록
│   │   └── new/page.tsx              # 관측 등록
│   ├── stats/
│   │   └── page.tsx                  # 통계 / 그래프
│   └── api/
│       ├── identify/route.ts         # Claude API — 종 식별 (이미지 → 종명)
│       └── describe/route.ts         # Claude API — 설명 생성 (종명 → 설명)
├── components/
│   ├── ui/
│   │   ├── Header.tsx              # 내비게이션 링크 포함
│   │   └── LoadingSpinner.tsx
│   ├── auth/
│   │   └── AuthForm.tsx
│   ├── species/
│   │   ├── SpeciesCard.tsx
│   │   ├── SpeciesList.tsx
│   │   └── SpeciesForm.tsx
│   ├── observations/
│   │   ├── ObservationCard.tsx
│   │   ├── ObservationList.tsx
│   │   └── ObservationForm.tsx
│   ├── upload/
│   │   ├── ImageUpload.tsx           # Storage 업로드 UI
│   │   └── AIIdentifyButton.tsx      # AI 식별 트리거
│   └── stats/
│       ├── SeasonBarChart.tsx        # 계절별 출현 빈도
│       └── SpeciesPieChart.tsx       # 종별 비율
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # 브라우저용 Supabase client
│   │   └── server.ts                 # 서버용 Supabase client (cookies)
│   ├── claude.ts                     # Claude API 호출 헬퍼
│   ├── storage.ts                    # Storage 업로드/URL 헬퍼
│   └── utils.ts                      # 날짜, 계절 변환 등
├── types/
│   └── index.ts                      # Species, Observation, Profile 타입
├── supabase/
│   └── migrations/
│       ├── 20260326000001_initial_schema.sql
│       └── 20260326000002_storage_policies.sql
├── __tests__/
│   ├── api/
│   │   ├── identify.test.ts
│   │   └── describe.test.ts
│   ├── lib/
│   │   ├── utils.test.ts
│   │   └── storage.test.ts
│   └── components/
│       └── SpeciesCard.test.tsx
├── .env.local                        # (git ignore)
├── jest.config.ts
└── jest.setup.ts
```

---

## Phase 1: Foundation

---

### Task 1: Next.js 프로젝트 초기화

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `jest.config.ts`, `jest.setup.ts`

- [ ] **Step 1: Next.js 앱 생성**

```bash
cd /Users/kim-yeonghwi/pond-ecology
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --yes
```

- [ ] **Step 2: 추가 의존성 설치**

```bash
npm install @supabase/supabase-js @supabase/ssr recharts
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest ts-jest
```

- [ ] **Step 3: jest.config.ts 작성**

```typescript
// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  setupFilesAfterEach: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
}

export default createJestConfig(config)
```

- [ ] **Step 4: jest.setup.ts 작성**

```typescript
// jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "chore: initialize Next.js project with Supabase and Jest"
```

---

### Task 2: Supabase 스키마 마이그레이션

**Files:**
- Create: `supabase/migrations/20260326000001_initial_schema.sql`
- Create: `supabase/migrations/20260326000002_storage_policies.sql`

- [ ] **Step 1: 초기 스키마 SQL 작성**

```sql
-- supabase/migrations/20260326000001_initial_schema.sql

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

-- profiles RLS: 본인만 수정, 전체 읽기
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- species RLS: 전체 읽기, 로그인 사용자 등록
CREATE POLICY "species_select_all" ON species FOR SELECT USING (true);
CREATE POLICY "species_insert_auth" ON species FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "species_update_own" ON species FOR UPDATE USING (auth.uid() = created_by);

-- observations RLS: 전체 읽기, 로그인 사용자 등록
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
```

- [ ] **Step 2: Storage 정책 SQL 작성**

```sql
-- supabase/migrations/20260326000002_storage_policies.sql

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
```

- [ ] **Step 3: Supabase 대시보드에서 마이그레이션 실행**

Supabase Dashboard → SQL Editor에서 두 파일 순서대로 실행.
URL: https://supabase.com/dashboard/project/oslxvvchyvhibljuamck

- [ ] **Step 4: 커밋**

```bash
git add supabase/
git commit -m "feat: add initial database schema and storage policies"
```

---

### Task 3: 환경 변수 및 Supabase 클라이언트 설정

**Files:**
- Create: `.env.local`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `types/index.ts`

- [ ] **Step 1: .env.local 작성**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://oslxvvchyvhibljuamck.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_nWC4bthRWcN_wi4hvYNdSw_baai0_Lc
ANTHROPIC_API_KEY=sk-ant-...  # Anthropic 콘솔에서 발급
```

- [ ] **Step 2: 브라우저용 클라이언트 작성**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: 서버용 클라이언트 작성**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

- [ ] **Step 4: TypeScript 타입 정의**

```typescript
// types/index.ts
export interface Profile {
  id: string
  display_name: string
  grade: number | null
  class: string | null
  created_at: string
}

export type SpeciesCategory = '어류' | '양서류' | '곤충' | '식물' | '조류' | '기타'

export interface Species {
  id: string
  name_ko: string
  name_scientific: string | null
  category: SpeciesCategory
  description: string | null
  habitat: string | null
  image_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Season = '봄' | '여름' | '가을' | '겨울'

export interface Observation {
  id: string
  species_id: string
  observer_id: string
  observed_at: string
  season: Season
  location: string | null
  count: number
  notes: string | null
  image_url: string | null
  weather: string | null
  created_at: string
  species?: Species
  observer?: Profile
}
```

- [ ] **Step 5: 커밋**

```bash
git add lib/ types/ .env.local
git commit -m "feat: add Supabase clients and TypeScript types"
```

---

### Task 4: 유틸리티 함수 (TDD)

**Files:**
- Create: `lib/utils.ts`
- Create: `__tests__/lib/utils.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// __tests__/lib/utils.test.ts
import { getSeasonFromDate, formatDate, formatCount } from '@/lib/utils'

describe('getSeasonFromDate', () => {
  it('3월은 봄', () => expect(getSeasonFromDate('2026-03-15')).toBe('봄'))
  it('7월은 여름', () => expect(getSeasonFromDate('2026-07-10')).toBe('여름'))
  it('10월은 가을', () => expect(getSeasonFromDate('2026-10-20')).toBe('가을'))
  it('12월은 겨울', () => expect(getSeasonFromDate('2026-12-01')).toBe('겨울'))
  it('2월은 겨울', () => expect(getSeasonFromDate('2026-02-14')).toBe('겨울'))
})

describe('formatDate', () => {
  it('YYYY-MM-DD 형식 반환', () => {
    expect(formatDate('2026-03-26T09:00:00Z')).toBe('2026.03.26')
  })
})

describe('formatCount', () => {
  it('1마리', () => expect(formatCount(1)).toBe('1마리'))
  it('5마리', () => expect(formatCount(5)).toBe('5마리'))
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx jest __tests__/lib/utils.test.ts --no-coverage
```

Expected: FAIL (utils.ts not found)

- [ ] **Step 3: 구현**

```typescript
// lib/utils.ts
import { Season } from '@/types'

export function getSeasonFromDate(dateStr: string): Season {
  const month = new Date(dateStr).getMonth() + 1
  if (month >= 3 && month <= 5) return '봄'
  if (month >= 6 && month <= 8) return '여름'
  if (month >= 9 && month <= 11) return '가을'
  return '겨울'
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

export function formatCount(count: number): string {
  return `${count}마리`
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/lib/utils.test.ts --no-coverage
```

Expected: PASS (7 tests)

- [ ] **Step 5: 커밋**

```bash
git add lib/utils.ts __tests__/lib/utils.test.ts
git commit -m "feat: add utility functions with tests"
```

---

## Phase 2: 인증 시스템

---

### Task 5: 레이아웃 + 인증 UI

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/ui/Header.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`
- Create: `components/auth/AuthForm.tsx`

- [ ] **Step 1: 루트 레이아웃 수정**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/ui/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '연못 생태 도감',
  description: '학교 연못 생물 관찰 기록',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Header 컴포넌트 작성**

```typescript
// components/ui/Header.tsx
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-green-700 text-white shadow">
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/species" className="text-xl font-bold">🌿 연못 생태 도감</Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/species">도감</Link>
          <Link href="/observations">관측 기록</Link>
          <Link href="/stats">통계</Link>
          {user ? (
            <button onClick={handleLogout}>로그아웃</button>
          ) : (
            <Link href="/login">로그인</Link>
          )}
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: AuthForm 컴포넌트 작성**

```typescript
// components/auth/AuthForm.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props { mode: 'login' | 'signup' }

export default function AuthForm({ mode }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); return }
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { display_name: displayName } },
      })
      if (error) { setError(error.message); return }
    }
    router.push('/species')
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-16 space-y-4">
      <h1 className="text-2xl font-bold text-center">
        {mode === 'login' ? '로그인' : '회원가입'}
      </h1>
      {mode === 'signup' && (
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="이름"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          required
        />
      )}
      <input
        className="w-full border rounded px-3 py-2"
        type="email" placeholder="이메일"
        value={email} onChange={e => setEmail(e.target.value)} required
      />
      <input
        className="w-full border rounded px-3 py-2"
        type="password" placeholder="비밀번호"
        value={password} onChange={e => setPassword(e.target.value)} required
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
        {mode === 'login' ? '로그인' : '가입하기'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: 로그인/회원가입 페이지 작성**

```typescript
// app/(auth)/login/page.tsx
import AuthForm from '@/components/auth/AuthForm'
export default function LoginPage() { return <AuthForm mode="login" /> }

// app/(auth)/signup/page.tsx
import AuthForm from '@/components/auth/AuthForm'
export default function SignupPage() { return <AuthForm mode="signup" /> }
```

- [ ] **Step 5: 개발 서버에서 인증 동작 확인**

```bash
npm run dev
# http://localhost:3000/signup → 가입 → /login → 로그인 → /species 리다이렉트 확인
```

- [ ] **Step 6: 커밋**

```bash
git add app/ components/
git commit -m "feat: add auth layout, header, and login/signup forms"
```

---

## Phase 3: 생물 도감

---

### Task 6: 생물 목록 페이지

**Files:**
- Create: `components/species/SpeciesCard.tsx`
- Create: `components/species/SpeciesList.tsx`
- Create: `app/species/page.tsx`
- Create: `__tests__/components/SpeciesCard.test.tsx`

- [ ] **Step 1: SpeciesCard 테스트 작성**

```typescript
// __tests__/components/SpeciesCard.test.tsx
import { render, screen } from '@testing-library/react'
import SpeciesCard from '@/components/species/SpeciesCard'
import type { Species } from '@/types'

const mockSpecies: Species = {
  id: '1', name_ko: '개구리', name_scientific: 'Rana nigromaculata',
  category: '양서류', description: '연못에 사는 개구리', habitat: '연못가',
  image_url: null, created_by: null,
  created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z',
}

it('생물 이름과 카테고리를 렌더링한다', () => {
  render(<SpeciesCard species={mockSpecies} />)
  expect(screen.getByText('개구리')).toBeInTheDocument()
  expect(screen.getByText('양서류')).toBeInTheDocument()
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/components/SpeciesCard.test.tsx --no-coverage
```

- [ ] **Step 3: SpeciesCard 구현**

```typescript
// components/species/SpeciesCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import type { Species } from '@/types'

const CATEGORY_COLORS: Record<string, string> = {
  '어류': 'bg-blue-100 text-blue-800',
  '양서류': 'bg-green-100 text-green-800',
  '곤충': 'bg-yellow-100 text-yellow-800',
  '식물': 'bg-emerald-100 text-emerald-800',
  '조류': 'bg-sky-100 text-sky-800',
  '기타': 'bg-gray-100 text-gray-800',
}

export default function SpeciesCard({ species }: { species: Species }) {
  return (
    <Link href={`/species/${species.id}`} className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-40 bg-gray-100 relative">
        {species.image_url ? (
          <Image src={species.image_url} alt={species.name_ko} fill className="object-cover" />
        ) : (
          <div className="h-full flex items-center justify-center text-4xl">🌿</div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-lg">{species.name_ko}</h3>
        {species.name_scientific && (
          <p className="text-xs text-gray-500 italic">{species.name_scientific}</p>
        )}
        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[species.category]}`}>
          {species.category}
        </span>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: SpeciesList + species/page.tsx 구현**

```typescript
// components/species/SpeciesList.tsx
import SpeciesCard from './SpeciesCard'
import type { Species } from '@/types'

export default function SpeciesList({ species }: { species: Species[] }) {
  if (species.length === 0) return (
    <p className="text-center text-gray-500 mt-12">아직 등록된 생물이 없습니다.</p>
  )
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {species.map(s => <SpeciesCard key={s.id} species={s} />)}
    </div>
  )
}

// app/species/page.tsx
import { createClient } from '@/lib/supabase/server'
import SpeciesList from '@/components/species/SpeciesList'
import Link from 'next/link'

export default async function SpeciesPage() {
  const supabase = await createClient()
  const { data: species } = await supabase
    .from('species')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">생물 도감</h1>
        <Link href="/species/new" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
          + 생물 등록
        </Link>
      </div>
      <SpeciesList species={species ?? []} />
    </div>
  )
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
npx jest __tests__/components/SpeciesCard.test.tsx --no-coverage
```

- [ ] **Step 6: 커밋**

```bash
git add app/species/ components/species/
git commit -m "feat: add species list page with card component"
```

---

### Task 7: 생물 상세 페이지

**Files:**
- Create: `app/species/[id]/page.tsx`

- [ ] **Step 1: 상세 페이지 구현**

```typescript
// app/species/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'

export default async function SpeciesDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: species } = await supabase
    .from('species').select('*').eq('id', params.id).single()

  if (!species) notFound()

  const { data: observations } = await supabase
    .from('observations')
    .select('*')
    .eq('species_id', params.id)
    .order('observed_at', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-2xl mx-auto">
      {species.image_url && (
        <div className="relative h-64 rounded-lg overflow-hidden mb-6">
          <Image src={species.image_url} alt={species.name_ko} fill className="object-cover" />
        </div>
      )}
      <h1 className="text-3xl font-bold">{species.name_ko}</h1>
      {species.name_scientific && (
        <p className="text-gray-500 italic mb-2">{species.name_scientific}</p>
      )}
      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mb-4">
        {species.category}
      </span>
      {species.description && <p className="text-gray-700 mb-4">{species.description}</p>}
      {species.habitat && (
        <p className="text-sm text-gray-500">서식지: {species.habitat}</p>
      )}

      {observations && observations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">최근 관측 기록</h2>
          <ul className="space-y-2">
            {observations.map(obs => (
              <li key={obs.id} className="border rounded p-3 text-sm">
                {new Date(obs.observed_at).toLocaleDateString('ko-KR')} · {obs.season} · {obs.count}마리
                {obs.notes && <p className="text-gray-500 mt-1">{obs.notes}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/species/
git commit -m "feat: add species detail page with recent observations"
```

---

## Phase 4: AI 종 식별 + 생물 등록

---

### Task 8: Supabase Storage 업로드 헬퍼 (TDD)

**Files:**
- Create: `lib/storage.ts`
- Create: `__tests__/lib/storage.test.ts`

- [ ] **Step 1: storage.ts 테스트 작성**

```typescript
// __tests__/lib/storage.test.ts
import { getPublicUrl, generateStoragePath } from '@/lib/storage'

describe('generateStoragePath', () => {
  it('userId와 파일명으로 경로 생성', () => {
    const path = generateStoragePath('user123', 'photo.jpg')
    expect(path).toMatch(/^user123\/\d+_photo\.jpg$/)
  })
})

describe('getPublicUrl', () => {
  it('버킷과 경로로 공개 URL 반환', () => {
    const url = getPublicUrl('species-images', 'user123/photo.jpg')
    expect(url).toContain('species-images')
    expect(url).toContain('user123/photo.jpg')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/lib/storage.test.ts --no-coverage
```

- [ ] **Step 3: storage.ts 구현**

```typescript
// lib/storage.ts
import { createClient } from '@/lib/supabase/client'

export function generateStoragePath(userId: string, fileName: string): string {
  const timestamp = Date.now()
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/${timestamp}_${sanitized}`
}

export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadImage(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw new Error(`업로드 실패: ${error.message}`)
  return getPublicUrl(bucket, path)
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/lib/storage.test.ts --no-coverage
```

- [ ] **Step 5: 커밋**

```bash
git add lib/storage.ts __tests__/lib/storage.test.ts
git commit -m "feat: add Storage upload helper with tests"
```

---

### Task 9: Claude API — 종 식별 API Route (TDD)

**Files:**
- Create: `lib/claude.ts`
- Create: `app/api/identify/route.ts`
- Create: `app/api/describe/route.ts`
- Create: `__tests__/api/identify.test.ts`

- [ ] **Step 1: claude.ts 헬퍼 작성**

```typescript
// lib/claude.ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function identifySpeciesFromImage(imageBase64: string, mediaType: string): Promise<{
  name_ko: string
  name_scientific: string
  category: string
  confidence: string
}> {
  // 이미지 분석: Sonnet 사용 (비전 능력 + 비용 균형)
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType as 'image/jpeg', data: imageBase64 },
        },
        {
          type: 'text',
          text: `이 사진에 있는 생물의 종을 식별해주세요. 반드시 JSON 형식으로만 응답하세요:
{"name_ko": "한국어 이름", "name_scientific": "학명", "category": "어류|양서류|곤충|식물|조류|기타", "confidence": "높음|중간|낮음"}`,
        },
      ],
    }],
  })
  const text = (message.content[0] as { type: 'text'; text: string }).text
  // Claude가 JSON 이외의 텍스트를 포함할 수 있으므로 JSON 블록만 추출
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI가 유효한 종 정보를 반환하지 않았습니다')
  return JSON.parse(jsonMatch[0])
}

export async function generateSpeciesDescription(nameKo: string, nameScientific: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `${nameKo}(${nameScientific})에 대해 중학생이 이해할 수 있는 수준으로 2-3문장의 설명을 작성해주세요. 서식지, 특징, 생태적 역할을 포함하세요. 설명만 작성하고 다른 내용은 포함하지 마세요.`,
    }],
  })
  return (message.content[0] as { type: 'text'; text: string }).text.trim()
}
```

- [ ] **Step 2: identify API Route 작성**

```typescript
// app/api/identify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { identifySpeciesFromImage } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { imageBase64, mediaType } = await req.json()
  if (!imageBase64 || !mediaType) {
    return NextResponse.json({ error: '이미지 데이터가 필요합니다' }, { status: 400 })
  }

  const result = await identifySpeciesFromImage(imageBase64, mediaType)
  return NextResponse.json(result)
}
```

- [ ] **Step 3: describe API Route 작성**

```typescript
// app/api/describe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateSpeciesDescription } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { nameKo, nameScientific } = await req.json()
  if (!nameKo) return NextResponse.json({ error: '종명이 필요합니다' }, { status: 400 })

  const description = await generateSpeciesDescription(nameKo, nameScientific ?? '')
  return NextResponse.json({ description })
}
```

- [ ] **Step 4: npm install Anthropic SDK**

```bash
npm install @anthropic-ai/sdk
```

- [ ] **Step 5: identify API Route 테스트 작성**

```typescript
// __tests__/api/identify.test.ts
import { POST } from '@/app/api/identify/route'
import { NextRequest } from 'next/server'

// Supabase auth mock
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user1' } } }) },
  }),
}))

// Claude mock
jest.mock('@/lib/claude', () => ({
  identifySpeciesFromImage: jest.fn().mockResolvedValue({
    name_ko: '개구리', name_scientific: 'Rana nigromaculata',
    category: '양서류', confidence: '높음',
  }),
}))

describe('POST /api/identify', () => {
  it('유효한 이미지 데이터로 종 식별 결과 반환', async () => {
    const req = new NextRequest('http://localhost/api/identify', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: 'base64data', mediaType: 'image/jpeg' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.name_ko).toBe('개구리')
  })

  it('imageBase64 누락 시 400 반환', async () => {
    const req = new NextRequest('http://localhost/api/identify', {
      method: 'POST',
      body: JSON.stringify({ mediaType: 'image/jpeg' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 6: 테스트 실패 확인**

```bash
npx jest __tests__/api/identify.test.ts --no-coverage
```

Expected: FAIL (route not found)

- [ ] **Step 7: 테스트 통과 확인**

```bash
npx jest __tests__/api/identify.test.ts --no-coverage
```

Expected: PASS (2 tests)

- [ ] **Step 8: 커밋**

```bash
git add lib/claude.ts app/api/ __tests__/api/
git commit -m "feat: add Claude API routes for species identification and description"
```

---

### Task 10: 생물 등록 폼 (AI 식별 포함)

**Files:**
- Create: `components/upload/ImageUpload.tsx`
- Create: `components/upload/AIIdentifyButton.tsx`
- Create: `components/species/SpeciesForm.tsx`
- Create: `app/species/new/page.tsx`

- [ ] **Step 1: ImageUpload 컴포넌트**

```typescript
// components/upload/ImageUpload.tsx
'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'

interface Props {
  onFileSelect: (file: File, previewUrl: string) => void
}

export default function ImageUpload({ onFileSelect }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    onFileSelect(file, url)
  }

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-green-400 transition-colors"
      onClick={() => inputRef.current?.click()}
    >
      {preview ? (
        <div className="relative h-48">
          <Image src={preview} alt="미리보기" fill className="object-contain" />
        </div>
      ) : (
        <p className="text-gray-500">클릭해서 사진 선택 (JPG, PNG)</p>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  )
}
```

- [ ] **Step 2: AIIdentifyButton 컴포넌트**

```typescript
// components/upload/AIIdentifyButton.tsx
'use client'
import { useState } from 'react'

interface IdentifyResult {
  name_ko: string
  name_scientific: string
  category: string
  confidence: string
}

interface Props {
  file: File | null
  onResult: (result: IdentifyResult) => void
}

export default function AIIdentifyButton({ file, onResult }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleIdentify = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onResult(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'AI 식별 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleIdentify}
        disabled={!file || loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
      >
        {loading ? '🤖 AI 분석 중...' : '🔍 AI로 종 식별'}
      </button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 3: SpeciesForm 컴포넌트 작성**

```typescript
// components/species/SpeciesForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadImage, generateStoragePath } from '@/lib/storage'
import ImageUpload from '@/components/upload/ImageUpload'
import AIIdentifyButton from '@/components/upload/AIIdentifyButton'
import type { SpeciesCategory } from '@/types'

const CATEGORIES: SpeciesCategory[] = ['어류', '양서류', '곤충', '식물', '조류', '기타']

export default function SpeciesForm() {
  const [file, setFile] = useState<File | null>(null)
  const [nameKo, setNameKo] = useState('')
  const [nameScientific, setNameScientific] = useState('')
  const [category, setCategory] = useState<SpeciesCategory>('기타')
  const [description, setDescription] = useState('')
  const [habitat, setHabitat] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleAIResult = async (result: { name_ko: string; name_scientific: string; category: string }) => {
    setNameKo(result.name_ko)
    setNameScientific(result.name_scientific)
    if (CATEGORIES.includes(result.category as SpeciesCategory)) {
      setCategory(result.category as SpeciesCategory)
    }
    // 설명 자동 생성
    const res = await fetch('/api/describe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameKo: result.name_ko, nameScientific: result.name_scientific }),
    })
    if (res.ok) {
      const { description } = await res.json()
      setDescription(description)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다')

      let imageUrl: string | null = null
      if (file) {
        const path = generateStoragePath(user.id, file.name)
        imageUrl = await uploadImage('species-images', path, file)
      }

      const { data, error: dbError } = await supabase.from('species').insert({
        name_ko: nameKo, name_scientific: nameScientific || null,
        category, description: description || null,
        habitat: habitat || null, image_url: imageUrl,
        created_by: user.id,
      }).select().single()

      if (dbError) throw new Error(dbError.message)
      router.push(`/species/${data.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '등록 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">생물 등록</h1>
      <ImageUpload onFileSelect={(f) => setFile(f)} />
      <AIIdentifyButton file={file} onResult={handleAIResult} />

      <div>
        <label className="block text-sm font-medium mb-1">생물 이름 *</label>
        <input className="w-full border rounded px-3 py-2" value={nameKo} onChange={e => setNameKo(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">학명</label>
        <input className="w-full border rounded px-3 py-2 italic" value={nameScientific} onChange={e => setNameScientific(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">분류 *</label>
        <select className="w-full border rounded px-3 py-2" value={category} onChange={e => setCategory(e.target.value as SpeciesCategory)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">설명</label>
        <textarea className="w-full border rounded px-3 py-2 h-24" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">서식지</label>
        <input className="w-full border rounded px-3 py-2" value={habitat} onChange={e => setHabitat(e.target.value)} />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">
        {loading ? '등록 중...' : '생물 등록하기'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: new/page.tsx 작성**

```typescript
// app/species/new/page.tsx
import SpeciesForm from '@/components/species/SpeciesForm'
export default function NewSpeciesPage() { return <SpeciesForm /> }
```

- [ ] **Step 5: 전체 흐름 수동 테스트**

```
1. /species/new 접속
2. 개구리 사진 업로드
3. "AI로 종 식별" 클릭 → 이름/학명/설명 자동 채워짐 확인
4. "생물 등록하기" 클릭 → /species/{id} 리다이렉트 확인
5. Supabase Dashboard에서 species 테이블 데이터 확인
```

- [ ] **Step 6: 커밋**

```bash
git add components/ app/species/new/
git commit -m "feat: add species registration form with AI identification"
```

---

## Phase 5: 관측 기록

---

### Task 11: 관측 기록 등록 + 목록

**Files:**
- Create: `components/observations/ObservationForm.tsx`
- Create: `components/observations/ObservationCard.tsx`
- Create: `components/observations/ObservationList.tsx`
- Create: `app/observations/page.tsx`
- Create: `app/observations/new/page.tsx`

- [ ] **Step 1: ObservationCard 구현**

```typescript
// components/observations/ObservationCard.tsx
import type { Observation } from '@/types'
import { formatDate } from '@/lib/utils'

const SEASON_EMOJI: Record<string, string> = { 봄: '🌸', 여름: '☀️', 가을: '🍂', 겨울: '❄️' }

export default function ObservationCard({ obs }: { obs: Observation }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{obs.species?.name_ko ?? '알 수 없는 생물'}</h3>
          <p className="text-sm text-gray-500">
            {SEASON_EMOJI[obs.season]} {obs.season} · {formatDate(obs.observed_at)} · {obs.count}마리
          </p>
          {obs.location && <p className="text-sm text-gray-500">📍 {obs.location}</p>}
          {obs.notes && <p className="text-sm mt-1">{obs.notes}</p>}
        </div>
        <span className="text-2xl">{SEASON_EMOJI[obs.season]}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: ObservationList + observations/page.tsx 구현**

```typescript
// components/observations/ObservationList.tsx
import ObservationCard from './ObservationCard'
import type { Observation } from '@/types'

interface Props {
  observations: Observation[]
}

export default function ObservationList({ observations }: Props) {
  if (observations.length === 0) return (
    <p className="text-center text-gray-500 mt-12">아직 관측 기록이 없습니다.</p>
  )
  return (
    <div className="space-y-3">
      {observations.map(obs => <ObservationCard key={obs.id} obs={obs} />)}
    </div>
  )
}

// app/observations/page.tsx
import { createClient } from '@/lib/supabase/server'
import ObservationList from '@/components/observations/ObservationList'
import Link from 'next/link'

export default async function ObservationsPage() {
  const supabase = await createClient()
  const { data: observations } = await supabase
    .from('observations')
    .select('*, species(*)')
    .order('observed_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">관측 기록</h1>
        <Link href="/observations/new" className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
          + 관측 등록
        </Link>
      </div>
      <ObservationList observations={observations ?? []} />
    </div>
  )
}
```

- [ ] **Step 3: ObservationForm 구현**

```typescript
// components/observations/ObservationForm.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSeasonFromDate } from '@/lib/utils'
import type { Season, Species } from '@/types'

export default function ObservationForm() {
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [speciesId, setSpeciesId] = useState('')
  const [observedAt, setObservedAt] = useState(new Date().toISOString().slice(0, 16))
  const [count, setCount] = useState(1)
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [weather, setWeather] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('species').select('id, name_ko').order('name_ko')
      .then(({ data }) => setSpeciesList(data ?? []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('로그인이 필요합니다'); return }

    const season: Season = getSeasonFromDate(observedAt)
    const { error: dbError } = await supabase.from('observations').insert({
      species_id: speciesId,
      observer_id: user.id,
      observed_at: new Date(observedAt).toISOString(),
      season, count,
      location: location || null,
      notes: notes || null,
      weather: weather || null,
    })
    if (dbError) { setError(dbError.message); return }
    router.push('/observations')
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">관측 기록 등록</h1>
      <div>
        <label className="block text-sm font-medium mb-1">생물 선택 *</label>
        <select className="w-full border rounded px-3 py-2" value={speciesId} onChange={e => setSpeciesId(e.target.value)} required>
          <option value="">선택하세요</option>
          {speciesList.map(s => <option key={s.id} value={s.id}>{s.name_ko}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">관측 일시 *</label>
        <input type="datetime-local" className="w-full border rounded px-3 py-2" value={observedAt} onChange={e => setObservedAt(e.target.value)} required />
        <p className="text-xs text-gray-500 mt-1">계절: {getSeasonFromDate(observedAt)}</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">개체 수</label>
        <input type="number" min={1} className="w-full border rounded px-3 py-2" value={count} onChange={e => setCount(Number(e.target.value))} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">위치</label>
        <input className="w-full border rounded px-3 py-2" placeholder="예: 연못 북쪽" value={location} onChange={e => setLocation(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">날씨</label>
        <input className="w-full border rounded px-3 py-2" placeholder="예: 맑음, 흐림" value={weather} onChange={e => setWeather(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">메모</label>
        <textarea className="w-full border rounded px-3 py-2 h-20" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
        기록 저장하기
      </button>
    </form>
  )
}
```

- [ ] **Step 4: observations/new/page.tsx 작성**

```typescript
// app/observations/new/page.tsx
import ObservationForm from '@/components/observations/ObservationForm'
export default function NewObservationPage() { return <ObservationForm /> }
```

- [ ] **Step 5: 커밋**

```bash
git add app/observations/ components/observations/
git commit -m "feat: add observation records list and registration form"
```

---

## Phase 6: 통계 및 그래프

---

### Task 12: 생태계 변화 통계 페이지

**Files:**
- Create: `components/stats/SeasonBarChart.tsx`
- Create: `components/stats/SpeciesPieChart.tsx`
- Create: `app/stats/page.tsx`

- [ ] **Step 1: SeasonBarChart 구현**

```typescript
// components/stats/SeasonBarChart.tsx
'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

interface Props {
  data: { season: string; count: number }[]
}

export default function SeasonBarChart({ data }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">계절별 관측 빈도</h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="season" />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={(v) => [`${v}회`, '관측 수']} />
          <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: SpeciesPieChart 구현**

```typescript
// components/stats/SpeciesPieChart.tsx
'use client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2']

interface Props {
  data: { name: string; value: number }[]
}

export default function SpeciesPieChart({ data }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">종별 관측 비율</h2>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: stats/page.tsx 구현**

```typescript
// app/stats/page.tsx
import { createClient } from '@/lib/supabase/server'
import SeasonBarChart from '@/components/stats/SeasonBarChart'
import SpeciesPieChart from '@/components/stats/SpeciesPieChart'

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: observations } = await supabase
    .from('observations')
    .select('season, count, species(name_ko, category)')

  if (!observations || observations.length === 0) {
    return (
      <div className="text-center mt-16 text-gray-500">
        <p className="text-4xl mb-4">📊</p>
        <p>관측 기록이 쌓이면 통계가 표시됩니다.</p>
      </div>
    )
  }

  // 계절별 관측 수
  const seasonMap: Record<string, number> = { 봄: 0, 여름: 0, 가을: 0, 겨울: 0 }
  observations.forEach(obs => { seasonMap[obs.season] = (seasonMap[obs.season] ?? 0) + obs.count })
  const seasonData = Object.entries(seasonMap).map(([season, count]) => ({ season, count }))

  // 종별 관측 수
  const speciesMap: Record<string, number> = {}
  observations.forEach(obs => {
    const name = (obs.species as { name_ko: string } | null)?.name_ko ?? '알 수 없음'
    speciesMap[name] = (speciesMap[name] ?? 0) + obs.count
  })
  const speciesData = Object.entries(speciesMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // 총 통계
  const totalObs = observations.length
  const uniqueSpecies = new Set(observations.map(o => (o.species as { name_ko: string } | null)?.name_ko)).size

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">생태계 변화 통계</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{totalObs}</p>
          <p className="text-sm text-gray-500">총 관측 기록</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{uniqueSpecies}</p>
          <p className="text-sm text-gray-500">관측된 종 수</p>
        </div>
      </div>
      <SeasonBarChart data={seasonData} />
      <SpeciesPieChart data={speciesData} />
    </div>
  )
}
```

- [ ] **Step 4: 커밋**

```bash
git add app/stats/ components/stats/
git commit -m "feat: add ecosystem statistics page with seasonal and species charts"
```

---

## Phase 7: 마무리 및 배포

---

### Task 13: 홈 페이지 + 404 처리

**Files:**
- Modify: `app/page.tsx`
- Create: `app/not-found.tsx`

- [ ] **Step 1: 홈 redirect + 404 작성**

```typescript
// app/page.tsx
import { redirect } from 'next/navigation'
export default function Home() { redirect('/species') }

// app/not-found.tsx
import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="text-center mt-24">
      <p className="text-6xl mb-4">🌿</p>
      <h1 className="text-2xl font-bold mb-2">페이지를 찾을 수 없습니다</h1>
      <Link href="/species" className="text-green-600 hover:underline">도감으로 돌아가기</Link>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/page.tsx app/not-found.tsx
git commit -m "feat: add home redirect and 404 page"
```

---

### Task 14: Vercel 배포

**Files:**
- Create: `.env.local` (이미 있음)

- [ ] **Step 1: .gitignore 확인**

```bash
# .env.local이 .gitignore에 포함되어 있는지 확인
grep ".env.local" .gitignore
```

Expected: `.env.local` 이 목록에 있어야 함

- [ ] **Step 2: 빌드 오류 확인**

```bash
npm run build
```

Expected: 빌드 성공. 오류 있으면 수정 후 재빌드.

- [ ] **Step 3: Vercel 배포**

```bash
npx vercel --prod
# 또는 GitHub에 push 후 Vercel Dashboard에서 연동
```

- [ ] **Step 4: Vercel 환경 변수 설정**

Vercel Dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL = https://oslxvvchyvhibljuamck.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_nWC4bthRWcN_wi4hvYNdSw_baai0_Lc
ANTHROPIC_API_KEY = sk-ant-...
```

- [ ] **Step 5: 배포 후 기능 검증**

```
✅ 회원가입 / 로그인
✅ 생물 등록 (AI 식별 포함)
✅ 관측 기록 등록
✅ 통계 페이지 그래프
✅ 모바일 화면 레이아웃
```

- [ ] **Step 6: 최종 커밋 & 태그**

```bash
git add -A
git commit -m "chore: finalize for production deployment"
git tag v1.0.0
git push origin main --tags
```

---

## 전체 테스트 실행

```bash
# 단위 테스트 전체 실행
npx jest --no-coverage

# 빌드 타입 체크
npm run build
```

Expected: 모든 테스트 PASS, 빌드 성공
