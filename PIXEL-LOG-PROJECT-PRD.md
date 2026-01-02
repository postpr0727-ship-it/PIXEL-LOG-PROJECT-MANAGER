# PIXEL-LOG PROJECT - PRD (Product Requirements Document)

## 📋 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | PIXEL-LOG PROJECT |
| **목적** | 개인 프로젝트 관리 및 진행률 시각화 웹 애플리케이션 |
| **타겟 사용자** | 운동, 자기계발, 업무 등 다양한 목표를 체계적으로 관리하고 싶은 개인 |
| **핵심 가치** | 시각적 만족감 + 진행률의 실시간 피드백 + 카테고리별 체계적 관리 |

---

## 🎨 브랜드 디자인 시스템

### 컬러 팔레트 (로고 기반)

```css
:root {
  /* Primary Colors */
  --primary-navy: #1A1F3D;
  --primary-gold: #F5C542;
  
  /* Navy Variations */
  --navy-dark: #0F1225;
  --navy-light: #2A3154;
  --navy-muted: #3D4567;
  
  /* Gold Variations */
  --gold-light: #FFDA6A;
  --gold-dark: #D4A832;
  --gold-muted: #E8C965;
  
  /* Neutral Colors */
  --white: #FFFFFF;
  --gray-100: #F8F9FA;
  --gray-200: #E9ECEF;
  --gray-300: #DEE2E6;
  --gray-400: #CED4DA;
  --gray-500: #ADB5BD;
  --gray-600: #6C757D;
  --gray-700: #495057;
  --gray-800: #343A40;
  --gray-900: #212529;
  
  /* Semantic Colors */
  --success: #28A745;
  --warning: #FFC107;
  --danger: #DC3545;
  --info: #17A2B8;
  
  /* Category Colors */
  --category-fitness: #FF6B6B;
  --category-growth: #4ECDC4;
  --category-work: #5B8DEE;
  --category-hobby: #A66DD4;
  --category-study: #FF9F43;
  
  /* Gradients */
  --gradient-hero: linear-gradient(135deg, var(--primary-navy) 0%, var(--navy-light) 100%);
  --gradient-gold: linear-gradient(135deg, var(--gold-dark) 0%, var(--primary-gold) 50%, var(--gold-light) 100%);
  --gradient-progress: linear-gradient(90deg, var(--primary-gold) 0%, var(--gold-light) 100%);
}
```

### 타이포그래피

```css
/* 폰트 설정 */
--font-display: 'Pretendard', 'Inter', sans-serif;
--font-body: 'Pretendard', sans-serif;

/* 폰트 사이즈 */
--text-hero: clamp(3rem, 8vw, 6rem);
--text-h1: clamp(2rem, 4vw, 3rem);
--text-h2: clamp(1.5rem, 3vw, 2rem);
--text-h3: clamp(1.25rem, 2vw, 1.5rem);
--text-body: 1rem;
--text-small: 0.875rem;
--text-tiny: 0.75rem;
```

---

## 🏗 페이지 구조

### 1. 히어로 섹션 (Hero Section)

**디자인 요구사항:**
- 전체 뷰포트 높이의 80-100vh
- 배경: 네이비 그라데이션 + 동적 파티클/기하학적 애니메이션
- 로고 + 타이틀 "PIXEL-LOG PROJECT" 중앙 배치
- 골드 컬러의 애니메이션 강조선/글로우 효과
- 스크롤 다운 인디케이터 (바운스 애니메이션)

**포함 요소:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [동적 배경 애니메이션]                      │
│                                                             │
│                      PIXEL-LOG                              │
│                       PROJECT                               │
│                                                             │
│              "나의 성장을 픽셀 단위로 기록하다"                  │
│                                                             │
│                   [+ 새 프로젝트 만들기]                       │
│                                                             │
│                         ∨                                   │
│                    (scroll down)                            │
└─────────────────────────────────────────────────────────────┘
```

**애니메이션 상세:**
- 배경: 떠다니는 기하학적 도형 (삼각형, 원, 사각형) - 골드 컬러 아웃라인
- 마우스 패럴랙스 효과
- 타이틀 등장 시 글리치/타이핑 효과

---

### 2. 프로젝트 카드 그리드 섹션

**레이아웃:**
- Masonry 또는 CSS Grid 레이아웃
- 반응형: Desktop 4열 → Tablet 2열 → Mobile 1열
- 카드 호버 시 확대 + 그림자 효과

**카드 컴포넌트 구조:**
```
┌─────────────────────────────────┐
│  [썸네일 이미지 / 카테고리 색상]   │
│  ─────────────────────────────  │
│  📁 카테고리 라벨                │
│  프로젝트 제목                   │
│  프로젝트 설명 (2줄 말줄임)       │
│                                 │
│  📅 2025.01.01 ~ 2025.01.31    │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ████████████░░░░░ 67%  │   │  ← 애니메이션 프로그레스 바
│  └─────────────────────────┘   │
│                                 │
│  ✓ 8/12 완료                   │
└─────────────────────────────────┘
```

---

### 3. 프로젝트 상세/생성 모달

**프로젝트 생성 폼 필드:**

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| 썸네일 | Image Upload | 선택 | 프로젝트 대표 이미지 (미선택 시 카테고리 기본 이미지) |
| 카테고리 | Select | 필수 | 운동, 자기계발, 업무, 취미, 학습 + 커스텀 추가 가능 |
| 프로젝트명 | Text | 필수 | 최대 50자 |
| 설명 | Textarea | 선택 | 최대 200자 |
| 시작일 | Date Picker | 필수 | 프로젝트 시작 날짜 |
| 종료일 | Date Picker | 필수 | 프로젝트 마감 날짜 |
| 체크리스트 | Dynamic List | 필수 | 최소 1개, 동적 추가/삭제 가능 |

**체크리스트 입력 UI:**
```
체크리스트 항목
┌─────────────────────────────────────────┐
│ ☐ 1주차 - 월/수/금 운동하기        [✕] │
│ ☐ 2주차 - 월/수/금 운동하기        [✕] │
│ ☐ 3주차 - 월/수/금 운동하기        [✕] │
│ ☐ 4주차 - 월/수/금 운동하기        [✕] │
│                                         │
│        [+ 항목 추가]                     │
└─────────────────────────────────────────┘
```

---

## ⚡ 핵심 기능 명세

### 1. 진행률 계산 시스템

```javascript
// 진행률 계산 로직
const calculateProgress = (checklist) => {
  const total = checklist.length;
  const completed = checklist.filter(item => item.checked).length;
  return Math.round((completed / total) * 100);
};

// 예시
// 체크리스트 2개 중 1개 완료 → 50%
// 체크리스트 4개 중 3개 완료 → 75%
```

### 2. 진행률 모션 그래픽 (핵심 UX)

**프로그레스 바 애니메이션:**
- 체크박스 클릭 시 → 프로그레스 바가 부드럽게 확장
- 이징: `cubic-bezier(0.34, 1.56, 0.64, 1)` (탄성 효과)
- 지속시간: 600ms
- 퍼센트 숫자 카운트업 애니메이션

**시각적 피드백:**
```
0%   → 회색 바
1-25%  → 골드 (시작)
26-50% → 골드 + 미세한 펄스 효과
51-75% → 골드 + 글로우 효과
76-99% → 골드 + 파티클 효과
100%   → 완료 축하 애니메이션 (컨페티 + 체크마크)
```

**100% 달성 시 축하 애니메이션:**
- 컨페티(색종이) 파티클 폭발
- 카드 전체 골드 글로우
- "🎉 목표 달성!" 토스트 메시지
- 효과음 (선택적, 기본 OFF)

### 3. 카테고리 시스템

**기본 카테고리:**
| 카테고리 | 아이콘 | 컬러 | 기본 썸네일 |
|----------|--------|------|-------------|
| 운동 | 💪 | #FF6B6B | 런닝/덤벨 일러스트 |
| 자기계발 | 📚 | #4ECDC4 | 책/명상 일러스트 |
| 업무 | 💼 | #5B8DEE | 노트북/문서 일러스트 |
| 취미 | 🎨 | #A66DD4 | 팔레트/음악 일러스트 |
| 학습 | 🎓 | #FF9F43 | 졸업모자/연필 일러스트 |
| 커스텀 | ⭐ | 사용자 지정 | 사용자 업로드 |

### 4. 날짜 기반 프로젝트 관리

**월별 프로젝트 예시 (운동):**
```
📅 2025년 1월 운동 프로젝트
├── 프로젝트명: "1월 주3회 운동 챌린지"
├── 기간: 2025.01.01 ~ 2025.01.31
├── 카테고리: 운동
└── 체크리스트:
    ├── ☐ 1주차 (1/1~1/5): 월/수/금 운동
    ├── ☐ 2주차 (1/6~1/12): 월/수/금 운동
    ├── ☐ 3주차 (1/13~1/19): 월/수/금 운동
    └── ☐ 4주차 (1/20~1/26): 월/수/금 운동
```

**자동 체크리스트 생성 옵션 (선택적 구현):**
- "주 N회" 선택 시 → 해당 월의 주차별 체크리스트 자동 생성
- 요일 선택 → 구체적인 요일 표시

---

## 🗃 데이터 구조

### Project Schema

```typescript
interface Project {
  id: string;                    // UUID
  title: string;                 // 프로젝트명
  description: string;           // 설명
  category: CategoryType;        // 카테고리
  thumbnail: string | null;      // 썸네일 URL
  startDate: Date;               // 시작일
  endDate: Date;                 // 종료일
  checklist: ChecklistItem[];    // 체크리스트
  progress: number;              // 진행률 (0-100)
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  order: number;
}

type CategoryType = 
  | 'fitness'     // 운동
  | 'growth'      // 자기계발
  | 'work'        // 업무
  | 'hobby'       // 취미
  | 'study'       // 학습
  | 'custom';     // 커스텀
```

### 로컬 스토리지 구조

```javascript
// localStorage key: 'pixel-log-projects'
{
  "projects": [...],
  "categories": [...],  // 커스텀 카테고리
  "settings": {
    "theme": "dark",    // dark (네이비) / light
    "animations": true,
    "sounds": false
  }
}
```

---

## 📱 반응형 브레이크포인트

```css
/* Mobile First */
--mobile: 0px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1440px;

/* 카드 그리드 */
@media (min-width: 768px) {
  /* 2 columns */
}
@media (min-width: 1024px) {
  /* 3 columns */
}
@media (min-width: 1440px) {
  /* 4 columns */
}
```

---

## 🎬 애니메이션 상세 명세

### 1. 히어로 섹션 애니메이션

```css
/* 배경 파티클 */
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

/* 타이틀 등장 */
@keyframes glitch {
  0% { clip-path: inset(40% 0 61% 0); transform: translate(-2px, 2px); }
  20% { clip-path: inset(92% 0 1% 0); transform: translate(1px, -1px); }
  /* ... */
}

/* 스크롤 인디케이터 */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(10px); }
}
```

### 2. 프로그레스 바 애니메이션

```css
/* 기본 전환 */
.progress-bar {
  transition: width 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 숫자 카운트업 */
@keyframes countUp {
  from { content: "0%"; }
  to { content: var(--progress) "%"; }
}

/* 100% 달성 컨페티 */
.confetti {
  animation: confetti-fall 3s ease-out forwards;
}
```

### 3. 카드 인터랙션

```css
/* 호버 효과 */
.project-card {
  transition: transform 300ms ease, box-shadow 300ms ease;
}
.project-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(26, 31, 61, 0.3);
}

/* 카드 등장 */
@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 🛠 기술 스택 권장

| 레이어 | 기술 | 이유 |
|--------|------|------|
| 프레임워크 | **React 18+** 또는 **Next.js 14** | 컴포넌트 기반, 빠른 개발 |
| 스타일링 | **Tailwind CSS** + **Framer Motion** | 유틸리티 CSS + 선언적 애니메이션 |
| 상태관리 | **Zustand** 또는 **Jotai** | 가벼운 전역 상태 |
| 저장소 | **localStorage** (MVP) → **Supabase** (확장) | 빠른 MVP + 확장성 |
| 애니메이션 | **Framer Motion** + **Canvas Confetti** | 부드러운 UX + 축하 효과 |
| 아이콘 | **Lucide React** | 깔끔한 아이콘 세트 |
| 날짜 | **date-fns** | 가벼운 날짜 유틸리티 |

---

## 📋 개발 우선순위 (Phase)

### Phase 1: MVP (1~2주)
- [ ] 히어로 섹션 (기본 디자인)
- [ ] 프로젝트 CRUD (생성/읽기/수정/삭제)
- [ ] 카테고리 선택
- [ ] 체크리스트 기능
- [ ] 진행률 계산 및 표시
- [ ] 로컬 스토리지 저장
- [ ] 기본 카드 레이아웃

### Phase 2: 애니메이션 & UX (1주)
- [ ] 히어로 섹션 동적 배경
- [ ] 프로그레스 바 애니메이션
- [ ] 100% 달성 축하 효과
- [ ] 카드 호버/등장 애니메이션
- [ ] 반응형 최적화

### Phase 3: 고급 기능 (1주)
- [ ] 썸네일 이미지 업로드
- [ ] 커스텀 카테고리 추가
- [ ] 프로젝트 필터/정렬
- [ ] 다크/라이트 테마 토글
- [ ] 완료된 프로젝트 아카이브

### Phase 4: 확장 (선택)
- [ ] 백엔드 연동 (Supabase)
- [ ] 사용자 인증
- [ ] 통계 대시보드
- [ ] 알림 기능

---

## 📁 프로젝트 폴더 구조 (React 기준)

```
pixel-log-project/
├── public/
│   ├── images/
│   │   ├── logo.png
│   │   └── category-defaults/
│   └── fonts/
├── src/
│   ├── components/
│   │   ├── Hero/
│   │   │   ├── Hero.tsx
│   │   │   ├── AnimatedBackground.tsx
│   │   │   └── ScrollIndicator.tsx
│   │   ├── ProjectCard/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── Checklist.tsx
│   │   ├── ProjectModal/
│   │   │   ├── ProjectModal.tsx
│   │   │   ├── ProjectForm.tsx
│   │   │   └── CategorySelect.tsx
│   │   ├── UI/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   └── Toast.tsx
│   │   └── Confetti/
│   │       └── Confetti.tsx
│   ├── hooks/
│   │   ├── useProjects.ts
│   │   ├── useLocalStorage.ts
│   │   └── useAnimation.ts
│   ├── stores/
│   │   └── projectStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── calculateProgress.ts
│   │   └── formatDate.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── theme.css
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## ✅ 완료 기준 (Definition of Done)

- [ ] 모든 CRUD 기능이 정상 작동
- [ ] 체크리스트 변경 시 진행률이 즉시 반영
- [ ] 모든 애니메이션이 60fps로 부드럽게 동작
- [ ] 모바일/태블릿/데스크톱 반응형 완벽 대응
- [ ] 새로고침 후에도 데이터 유지 (로컬 스토리지)
- [ ] 100% 달성 시 축하 애니메이션 표시
- [ ] 접근성 (키보드 네비게이션, 스크린 리더)

---

## 🎯 성공 지표 (Success Metrics)

| 지표 | 목표 |
|------|------|
| 첫 로딩 시간 | < 2초 |
| 애니메이션 FPS | 60fps |
| 모바일 터치 반응성 | < 100ms |
| 라이트하우스 점수 | > 90 |

---

## 📝 참고 자료

- **디자인 레퍼런스**: Notion, Linear, Todoist
- **애니메이션 레퍼런스**: Framer Motion 공식 예제
- **컬러 시스템**: 브랜드 로고 기반 (Navy #1A1F3D + Gold #F5C542)

---

*문서 작성일: 2025년 1월*
*버전: 1.0*
