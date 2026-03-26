# 연못 생태 도감 — Gemini 역할 정의

## 이 프로젝트에서 Gemini의 역할: UI 디자인 담당

Claude Code는 로직·API·DB를 담당하고, **Gemini는 UI/UX 디자인을 담당**한다.

## 기술 스택
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- 한국어 UI 기본

## Gemini가 담당하는 작업

### 맡아도 되는 것
- Tailwind CSS 클래스 조합 및 컴포넌트 스타일링
- 레이아웃 구성 (그리드, 플렉스, 반응형)
- 색상 팔레트 제안 및 적용 (생태/자연 테마 — 초록 계열 중심)
- 카드, 버튼, 폼, 뱃지 등 UI 컴포넌트 디자인
- 모바일 반응형 처리
- 빈 상태(empty state), 로딩 UI 디자인
- 애니메이션/트랜지션 (Tailwind 기반)

### 건드리지 말 것
- `lib/supabase/`, `lib/claude.ts` — DB·AI 로직
- `app/api/` — 서버 API Route
- `supabase/migrations/` — DB 스키마
- 테스트 파일 (`__tests__/`)
- 환경 변수 (`.env.local`)

## 디자인 방향

**테마:** 학교 연못, 자연, 생태 — 신선하고 교육적인 느낌
**주 색상:** `green-700` (헤더), `green-600` (버튼), `emerald` (뱃지)
**폰트:** Inter (Next.js 기본)
**톤:** 학생 친화적, 깔끔하고 직관적

## 컴포넌트 위치
- `components/ui/` — 공통 UI
- `components/species/` — 생물 도감
- `components/observations/` — 관측 기록
- `components/stats/` — 통계/그래프
- `components/upload/` — 이미지 업로드

## 작업 예시

```
# Gemini에게 요청하는 방법
gemini "SpeciesCard 컴포넌트를 더 예쁘게 만들어줘. 호버 효과랑 이미지 오버레이 추가해줘."
gemini "observations 목록 페이지 레이아웃을 계절 탭 필터 UI로 바꿔줘."
gemini "빈 상태(데이터 없을 때) UI를 귀엽게 디자인해줘."
```
