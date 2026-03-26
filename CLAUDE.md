# 학교 연못 생태 도감 (Pond Ecology Field Guide)

## 프로젝트 개요
과학고 학교 연못의 생물들을 기록하고 탐구하는 웹 기반 생태 도감.
학생들이 직접 생물을 등록하고, AI로 종을 식별하며, 계절별 생태 변화를 추적한다.

## 기술 스택
- **Frontend**: Next.js + Tailwind CSS
- **Backend**: Supabase (DB + Storage + Auth)
- **AI**: Claude API (생물 종 식별 + 설명 생성)
- **배포**: Vercel

## 핵심 기능
1. 생물 도감 — 연못 생물 목록 + 상세 정보
2. 사진 업로드 + AI 종 식별
3. 관측 기록 — 날짜/위치/계절별 출현 기록
4. 생태계 변화 그래프 및 통계

## 코딩 규칙
- 컴포넌트는 기능 단위로 분리
- DB 접근은 Supabase client로 통일 (`lib/supabase.ts`)
- 이미지는 Supabase Storage에 저장
- UI 언어는 한국어 기본
- Claude API 호출은 서버 사이드(API Route)에서만 수행 (API 키 노출 방지)

## CCR 라우팅 전략
`~/.claude-code-router/config.json` 적용 완료:

| 슬롯 | 모델 | 역할 |
|------|------|------|
| default | `anthropic/claude-sonnet-4-5` | 컴포넌트, API Route, 테스트 |
| background | `google/gemini-2.0-flash-lite` | 파일 스캔, 자동 인덱싱 |
| think | `google/gemini-2.5-flash-preview:thinking` | Plan 모드, 설계, 복잡한 추론 |
| longContext | `google/gemini-2.0-flash` | 긴 파일 분석 (1M 컨텍스트) |

앱 내 Claude API: 종 식별 → `claude-sonnet-4-5`, 설명 생성 → `claude-haiku-4-5-20251001`

## 디렉토리 구조 (예정)
```
pond-ecology/
├── app/                  # Next.js App Router
│   ├── (auth)/           # 인증 관련 페이지
│   ├── species/          # 생물 도감 페이지
│   ├── observations/     # 관측 기록 페이지
│   └── api/              # API Routes (Claude API 호출 포함)
├── components/           # 재사용 컴포넌트
├── lib/
│   ├── supabase.ts       # Supabase client
│   └── claude.ts         # Claude API 헬퍼
├── types/                # TypeScript 타입 정의
└── supabase/             # Supabase 마이그레이션 및 설정
```

## 환경 변수
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```
