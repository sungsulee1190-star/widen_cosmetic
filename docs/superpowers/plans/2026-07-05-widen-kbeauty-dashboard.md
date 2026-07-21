# WIDEN K-Beauty SKU Intelligence Dashboard 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SKU 단위로 인기, 가격, 경쟁, 소싱, 성분/국가 리스크를 누적 추적하고 Fast Copycat 전략으로 전환하는 운영 대시보드를 구축한다.

**Architecture:** 단일 HTML/CSS/JS SPA. 접이식 사이드바 + 메인 콘텐츠 영역. 데이터는 `data/` 폴더의 JSON 파일에서 로드. LocalStorage로 액션 체크 상태, 즐겨찾기, 필터 상태를 유지. 향후 Notion API / Google Sheets 연동을 위한 데이터 레이어 분리.

**Tech Stack:**
- HTML5 / Vanilla CSS / Vanilla JS (ES Modules)
- Google Fonts (Inter, Noto Sans KR)
- Chart.js (트렌드 차트)
- Glassmorphism 다크 모드 디자인 시스템 (과거 v3 기반 강화)

## Global Constraints

- 프레임워크 없이 Vanilla HTML/CSS/JS로 구현한다 (단일 파일 배포 용이)
- 디자인은 Glassmorphism 다크 모드 — 과거 `index.html` v3의 CSS 변수 체계를 계승·강화
- 데스크톱 우선 (최소 1280px), 모바일 대응은 MVP 범위 밖
- 모든 텍스트는 한국어
- Notion 링크: https://app.notion.com/p/37744d5ca46c817db9f0e04cbf8b7c2c
- Google Drive 링크: https://drive.google.com/drive/folders/10d_wFsMKYxc8lPJ9AhtU8PF-u15IHp9e
- 파일 경로는 프로젝트 루트 기준

---

## 파일 구조 맵

```
K뷰티_DashBoard_260704/
├── index.html                    ← 엔트리 포인트 (HTML 셸)
├── css/
│   └── style.css                 ← 전체 디자인 시스템 + 컴포넌트 스타일
├── js/
│   ├── app.js                    ← 앱 초기화, 라우터, 사이드바 토글
│   ├── data-store.js             ← 데이터 로드(JSON) + LocalStorage 관리
│   ├── view-actions.js           ← "오늘의 액션" 뷰
│   ├── view-sku.js               ← "SKU 인텔리전스" 뷰
│   ├── view-copycat.js           ← "Qoo10 Copycat 보드" 뷰
│   ├── view-wiki.js              ← "성분 위키 + 국가별 주의사항" 뷰
│   ├── view-sourcing.js          ← "오프라인 소싱 루트" 뷰
│   └── view-reference.js         ← "경쟁사/인플루언서 레퍼런스" 뷰
├── data/
│   ├── sku-list.json             ← SKU 10개 초기 데이터
│   ├── actions.json              ← 오늘의 액션 샘플 데이터
│   ├── ingredients.json          ← 성분 위키 12개 초기 데이터
│   ├── countries.json            ← 국가별 주의사항 (일본, 대만)
│   ├── copycat-shops.json        ← Qoo10 편집샵 10곳 + 검색어 데이터
│   └── sourcing-routes.json      ← 오프라인 소싱 루트 (명동/성수/홍대)
└── docs/                         ← (기존 설계 문서 — 수정 없음)
```

---

### Task 1: 디자인 시스템 + HTML 셸 + 사이드바

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/app.js`

**Interfaces:**
- Consumes: 없음 (첫 번째 태스크)
- Produces:
  - `index.html` — 8개 메뉴 사이드바 + 빈 메인 콘텐츠 영역, 각 뷰 섹션 `<section id="view-*">`
  - `css/style.css` — CSS 변수, glass-panel, 사이드바, 메인 레이아웃, 카드, 태그, 필터, 버튼 클래스
  - `app.js` — `initApp()`, `navigate(viewId)`, `toggleSidebar()` 함수

- [ ] **Step 1: `css/style.css` 작성 — 디자인 시스템**

과거 v3의 CSS 변수 체계를 계승하면서 새 메뉴 구조에 맞게 강화한다.

```css
/* === CSS 변수 (v3 계승) === */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');

:root {
  --bg-color: #0f172a;
  --surface-glass: rgba(30, 41, 59, 0.7);
  --surface-glass-hover: rgba(30, 41, 59, 0.9);
  --border-glass: rgba(255, 255, 255, 0.1);
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-dim: #64748b;
  --accent-primary: #8b5cf6;
  --accent-secondary: #ec4899;
  --accent-cyan: #06b6d4;
  --accent-green: #10b981;
  --accent-orange: #f97316;
  --accent-red: #ef4444;
  --accent-gradient: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
  --sidebar-width: 280px;
  --sidebar-collapsed: 72px;
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', 'Noto Sans KR', sans-serif;
  background-color: var(--bg-color);
  background-image:
    radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.15) 0px, transparent 50%);
  background-attachment: fixed;
  color: var(--text-main);
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* === Glassmorphism 기본 패널 === */
.glass-panel {
  background: var(--surface-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-glass);
  border-radius: 16px;
}

/* === 접이식 사이드바 === */
.sidebar {
  width: var(--sidebar-width);
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-glass);
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px);
  transition: var(--transition-smooth);
  z-index: 10;
  overflow: hidden;
}
.sidebar.collapsed { width: var(--sidebar-collapsed); padding: 32px 12px; }
.sidebar.collapsed .nav-label,
.sidebar.collapsed .logo-sub,
.sidebar.collapsed .sidebar-footer-text,
.sidebar.collapsed .nav-badge { display: none; }

.logo-area { margin-bottom: 40px; }
.logo-area h1 {
  font-size: 28px; font-weight: 900;
  background: var(--accent-gradient);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  letter-spacing: -1px;
}

.nav-menu { list-style: none; flex: 1; }
.nav-item {
  padding: 14px 16px; margin-bottom: 6px; border-radius: 12px;
  cursor: pointer; font-size: 14px; font-weight: 600; color: var(--text-muted);
  transition: var(--transition-smooth);
  display: flex; align-items: center; gap: 12px;
  border: 1px solid transparent;
  white-space: nowrap;
}
.nav-item:hover { background: rgba(255,255,255,0.05); color: var(--text-main); }
.nav-item.active {
  background: rgba(139, 92, 246, 0.15); color: var(--text-main);
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
}
.nav-badge {
  margin-left: auto; background: var(--accent-primary);
  color: white; font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 10px; min-width: 24px; text-align: center;
}

/* === 메인 콘텐츠 === */
.main-content { flex: 1; overflow-y: auto; padding: 40px; scroll-behavior: smooth; }
.view-section { display: none; animation: slideUp 0.4s ease-out forwards; opacity: 0; transform: translateY(20px); }
.view-section.active { display: block; }
@keyframes slideUp { to { opacity: 1; transform: translateY(0); } }

.page-title { font-size: 32px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.5px; }
.page-desc { color: var(--text-muted); font-size: 15px; max-width: 800px; line-height: 1.6; margin-bottom: 32px; }

/* === 그리드 === */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
.grid-3 { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; margin-bottom: 24px; }
.grid-4 { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px; }

/* === 카드 === */
.card { padding: 24px; transition: transform 0.3s, box-shadow 0.3s; }
.card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
.card-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.card-meta { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }

/* === 태그 === */
.tag { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-right: 4px; margin-bottom: 4px; }
.tag-trend { background: rgba(236, 72, 153, 0.2); border: 1px solid rgba(236, 72, 153, 0.4); color: #fbcfe8; }
.tag-steady { background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #a7f3d0; }
.tag-season { background: rgba(249, 115, 22, 0.2); border: 1px solid rgba(249, 115, 22, 0.4); color: #fed7aa; }
.tag-sale { background: rgba(6, 182, 212, 0.2); border: 1px solid rgba(6, 182, 212, 0.4); color: #a5f3fc; }
.tag-ingredient { background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #c4b5fd; }

/* === 필터 바 === */
.filter-bar { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; align-items: center; }
.filter-select {
  padding: 10px 16px; border-radius: 10px; border: 1px solid var(--border-glass);
  background: rgba(0,0,0,0.3); color: var(--text-main); font-size: 13px; font-weight: 600;
  cursor: pointer; outline: none; transition: var(--transition-smooth);
}
.filter-select:focus { border-color: var(--accent-primary); }

/* === 버튼 === */
.btn { padding: 8px 16px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: var(--transition-smooth); }
.btn-primary { background: var(--accent-gradient); color: white; }
.btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
.btn-outline { background: transparent; border: 1px solid var(--border-glass); color: var(--text-muted); }
.btn-outline:hover { border-color: var(--accent-primary); color: var(--text-main); }

/* === 액션 상태 뱃지 === */
.status-badge { padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.status-incomplete { background: rgba(239,68,68,0.2); color: #fca5a5; }
.status-progress { background: rgba(249,115,22,0.2); color: #fed7aa; }
.status-done { background: rgba(16,185,129,0.2); color: #a7f3d0; }
.status-hold { background: rgba(100,116,139,0.2); color: #cbd5e1; }

/* === 검색 === */
.search-input {
  width: 100%; padding: 14px 20px; border-radius: 12px;
  background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass);
  color: white; font-size: 15px; outline: none; transition: var(--transition-smooth);
}
.search-input:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(139,92,246,0.15); }

/* === 외부 링크 === */
.ext-link {
  display: inline-flex; align-items: center; gap: 6px;
  color: var(--accent-cyan); font-size: 13px; font-weight: 600;
  text-decoration: none; transition: var(--transition-smooth);
}
.ext-link:hover { color: var(--accent-primary); text-decoration: underline; }

/* === 토글 버튼 === */
.sidebar-toggle {
  width: 36px; height: 36px; border-radius: 8px;
  background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass);
  color: var(--text-muted); cursor: pointer; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  transition: var(--transition-smooth); margin-bottom: 24px;
}
.sidebar-toggle:hover { background: rgba(255,255,255,0.1); color: var(--text-main); }
```

- [ ] **Step 2: `index.html` 작성 — HTML 셸**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WIDEN K-Beauty SKU Intelligence Dashboard</title>
  <meta name="description" content="K-뷰티 해외판매 SKU 중심 운영 대시보드">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

  <!-- 사이드바 -->
  <aside class="sidebar" id="sidebar">
    <button class="sidebar-toggle" id="sidebar-toggle" title="사이드바 접기/펼치기">☰</button>
    <div class="logo-area">
      <h1>WIDEN</h1>
      <p class="logo-sub">SKU Intelligence Dashboard</p>
    </div>
    <ul class="nav-menu" id="nav-menu">
      <li class="nav-item active" data-view="view-actions">
        <span class="nav-icon">⚡</span>
        <span class="nav-label">오늘의 액션</span>
        <span class="nav-badge" id="badge-actions">0</span>
      </li>
      <li class="nav-item" data-view="view-sku">
        <span class="nav-icon">📦</span>
        <span class="nav-label">SKU 인텔리전스</span>
        <span class="nav-badge" id="badge-sku">0</span>
      </li>
      <li class="nav-item" data-view="view-copycat">
        <span class="nav-icon">🔍</span>
        <span class="nav-label">Qoo10 Copycat 보드</span>
        <span class="nav-badge" id="badge-copycat">0</span>
      </li>
      <li class="nav-item" data-view="view-wiki">
        <span class="nav-icon">🧪</span>
        <span class="nav-label">성분 위키</span>
      </li>
      <li class="nav-item" data-view="view-country">
        <span class="nav-icon">🌏</span>
        <span class="nav-label">국가별 주의사항</span>
      </li>
      <li class="nav-item" data-view="view-sourcing">
        <span class="nav-icon">🏪</span>
        <span class="nav-label">오프라인 소싱 루트</span>
      </li>
      <li class="nav-item" data-view="view-reference">
        <span class="nav-icon">📋</span>
        <span class="nav-label">경쟁사/인플루언서</span>
      </li>
      <li class="nav-item" data-view="view-links">
        <span class="nav-icon">🔗</span>
        <span class="nav-label">Notion/Drive DB</span>
      </li>
    </ul>
    <div class="sidebar-footer">
      <span class="sidebar-footer-text" style="font-size:12px; color:var(--text-dim);">
        WIDEN Beauty Co. · 2026
      </span>
    </div>
  </aside>

  <!-- 메인 콘텐츠 -->
  <main class="main-content" id="main-content">
    <section id="view-actions" class="view-section active"></section>
    <section id="view-sku" class="view-section"></section>
    <section id="view-copycat" class="view-section"></section>
    <section id="view-wiki" class="view-section"></section>
    <section id="view-country" class="view-section"></section>
    <section id="view-sourcing" class="view-section"></section>
    <section id="view-reference" class="view-section"></section>
    <section id="view-links" class="view-section"></section>
  </main>

  <script src="js/data-store.js"></script>
  <script src="js/view-actions.js"></script>
  <script src="js/view-sku.js"></script>
  <script src="js/view-copycat.js"></script>
  <script src="js/view-wiki.js"></script>
  <script src="js/view-sourcing.js"></script>
  <script src="js/view-reference.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: `js/app.js` 작성 — 라우터 + 사이드바**

```javascript
// js/app.js — 앱 초기화, 네비게이션, 사이드바 토글

function navigate(viewId) {
  // 모든 뷰 섹션 비활성화
  document.querySelectorAll('.view-section').forEach(s => {
    s.classList.remove('active');
  });
  // 모든 네비게이션 아이템 비활성화
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.remove('active');
  });
  // 선택된 뷰 활성화
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
  }
  // 선택된 네비 활성화
  const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  if (navItem) {
    navItem.classList.add('active');
  }
  // LocalStorage에 마지막 뷰 저장
  localStorage.setItem('widen-last-view', viewId);
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
  localStorage.setItem('widen-sidebar-collapsed', sidebar.classList.contains('collapsed'));
}

function initApp() {
  // 사이드바 토글
  document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);

  // 사이드바 상태 복원
  if (localStorage.getItem('widen-sidebar-collapsed') === 'true') {
    document.getElementById('sidebar').classList.add('collapsed');
  }

  // 네비게이션 이벤트
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      navigate(item.dataset.view);
    });
  });

  // 마지막 뷰 복원 또는 기본 뷰
  const lastView = localStorage.getItem('widen-last-view') || 'view-actions';
  navigate(lastView);
}

document.addEventListener('DOMContentLoaded', initApp);
```

- [ ] **Step 4: 브라우저에서 `index.html`을 열어 사이드바 동작 확인**

Expected: 8개 메뉴가 있는 접이식 사이드바, 클릭 시 뷰 전환, Glassmorphism 다크 모드 배경

- [ ] **Step 5: 커밋**

```bash
git add index.html css/style.css js/app.js
git commit -m "feat: design system + HTML shell + collapsible sidebar"
```

---

### Task 2: 데이터 레이어 + JSON 초기 데이터

**Files:**
- Create: `js/data-store.js`
- Create: `data/sku-list.json`
- Create: `data/actions.json`
- Create: `data/ingredients.json`
- Create: `data/countries.json`
- Create: `data/copycat-shops.json`
- Create: `data/sourcing-routes.json`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `DataStore` 전역 객체:
    - `DataStore.load()` → Promise (모든 JSON 로드)
    - `DataStore.skus` → Array<SKU>
    - `DataStore.actions` → Array<Action>
    - `DataStore.ingredients` → Array<Ingredient>
    - `DataStore.countries` → Array<Country>
    - `DataStore.copycatShops` → Array<Shop>
    - `DataStore.sourcingRoutes` → Array<Route>
    - `DataStore.getActionState(id)` → string
    - `DataStore.setActionState(id, state)` → void (LocalStorage)
    - `DataStore.getFavorites()` → Array<string>
    - `DataStore.toggleFavorite(skuId)` → void

- [ ] **Step 1: `data/sku-list.json` 작성 — 첫 10개 SKU 데이터**

설계 강화 보고서의 10개 SKU 데이터를 JSON으로 구조화. 각 SKU에는 id, name, brand, category, ingredientTags, domesticPrice, qoo10Price, estimatedMargin, status, trendType, notionLink, driveLink, lastOfflineCheck, competitorCount 필드를 포함.

- [ ] **Step 2: 나머지 5개 JSON 파일 작성**

`actions.json` (7개 샘플 액션), `ingredients.json` (12개 성분), `countries.json` (일본/대만), `copycat-shops.json` (10개 편집샵), `sourcing-routes.json` (명동/성수/홍대) — 모두 설계 강화 보고서의 확정된 데이터를 기반으로 작성.

- [ ] **Step 3: `js/data-store.js` 작성 — 데이터 로드 + LocalStorage 관리**

```javascript
// js/data-store.js — 데이터 로드 및 상태 관리

const DataStore = {
  skus: [],
  actions: [],
  ingredients: [],
  countries: [],
  copycatShops: [],
  sourcingRoutes: [],

  async load() {
    const [skus, actions, ingredients, countries, shops, routes] = await Promise.all([
      fetch('data/sku-list.json').then(r => r.json()),
      fetch('data/actions.json').then(r => r.json()),
      fetch('data/ingredients.json').then(r => r.json()),
      fetch('data/countries.json').then(r => r.json()),
      fetch('data/copycat-shops.json').then(r => r.json()),
      fetch('data/sourcing-routes.json').then(r => r.json()),
    ]);
    this.skus = skus;
    this.actions = actions;
    this.ingredients = ingredients;
    this.countries = countries;
    this.copycatShops = shops;
    this.sourcingRoutes = routes;
  },

  // 액션 상태 (LocalStorage)
  getActionState(actionId) {
    const states = JSON.parse(localStorage.getItem('widen-action-states') || '{}');
    return states[actionId] || '미완료';
  },
  setActionState(actionId, state) {
    const states = JSON.parse(localStorage.getItem('widen-action-states') || '{}');
    states[actionId] = state;
    localStorage.setItem('widen-action-states', JSON.stringify(states));
  },

  // 즐겨찾기 (LocalStorage)
  getFavorites() {
    return JSON.parse(localStorage.getItem('widen-favorites') || '[]');
  },
  toggleFavorite(skuId) {
    const favs = this.getFavorites();
    const idx = favs.indexOf(skuId);
    if (idx === -1) { favs.push(skuId); } else { favs.splice(idx, 1); }
    localStorage.setItem('widen-favorites', JSON.stringify(favs));
  },
  isFavorite(skuId) {
    return this.getFavorites().includes(skuId);
  }
};
```

- [ ] **Step 4: `app.js`의 `initApp()`에 `DataStore.load()` 호출 추가**

```javascript
// initApp() 내 최상단에 추가:
await DataStore.load();
```

`initApp`을 `async function initApp()`으로 변경.

- [ ] **Step 5: 브라우저 콘솔에서 `DataStore.skus`가 10개 로드되는지 확인**

Expected: `DataStore.skus.length === 10`

- [ ] **Step 6: 커밋**

```bash
git add js/data-store.js data/
git commit -m "feat: data layer + initial JSON datasets for 10 SKUs"
```

---

### Task 3: "오늘의 액션" 뷰

**Files:**
- Create: `js/view-actions.js`
- Modify: `js/app.js` (뷰 렌더 호출)

**Interfaces:**
- Consumes: `DataStore.actions`, `DataStore.getActionState()`, `DataStore.setActionState()`
- Produces: `renderActionsView()` 함수 — `#view-actions`에 액션 카드 목록 렌더링

- [ ] **Step 1: `js/view-actions.js` 작성**

액션 카드에는: 작업 설명, 대상 SKU, 채널, 목적, 상태 드롭다운(미완료/진행중/완료/보류/재방문 필요/Notion 업데이트 필요/MD 리포트 작성 필요), 연결 링크(SKU 페이지, Qoo10 검색, Drive 폴더)를 표시.

상태 변경 시 `DataStore.setActionState()`로 LocalStorage에 즉시 저장.

상단에는 상태별 필터(전체/미완료/진행중/완료/보류)를 두어 빠르게 필터링.

- [ ] **Step 2: `app.js`의 `navigate()`에서 뷰별 렌더 함수 호출 추가**

```javascript
// navigate() 함수 내, 뷰 활성화 후:
if (viewId === 'view-actions') renderActionsView();
```

- [ ] **Step 3: 브라우저에서 "오늘의 액션" 뷰 확인**

Expected: 7개 액션 카드 표시, 상태 드롭다운 변경 시 새로고침 후에도 상태 유지

- [ ] **Step 4: 커밋**

```bash
git add js/view-actions.js js/app.js
git commit -m "feat: today's actions view with status persistence"
```

---

### Task 4: "SKU 인텔리전스" 뷰

**Files:**
- Create: `js/view-sku.js`
- Modify: `js/app.js` (라우터에 뷰 연결)

**Interfaces:**
- Consumes: `DataStore.skus`, `DataStore.isFavorite()`, `DataStore.toggleFavorite()`
- Produces: `renderSkuView()` 함수 — `#view-sku`에 필터 바 + SKU 카드 그리드 렌더링

- [ ] **Step 1: `js/view-sku.js` 작성**

필터 바: 기간(이번 주/이번 달/3개월/6개월/누적), 대분류(전체/향수/립/베이스/...), 채널(다이소/무신사/올리브영/Qoo10/Shopee), 상태(급상승/스테디/시즌성/세일 의존/소싱 후보/보류/판매중), 성분 태그, 마진 상태.

SKU 카드 필수 정보: 제품 이미지(placeholder), SKU명, 브랜드, 대분류, 성분 태그, 국내 소싱처 링크, 해외 판매처 링크, 상태 뱃지, 가격, 예상 마진, 관련 경쟁 페이지 수, 마지막 오프라인 확인일, Notion/Drive 링크, 즐겨찾기 토글.

검색 입력 필드: SKU명 또는 브랜드명으로 실시간 필터링.

- [ ] **Step 2: `app.js` 라우터에 연결**

```javascript
if (viewId === 'view-sku') renderSkuView();
```

- [ ] **Step 3: 필터 동작 확인**

Expected: 카테고리/상태/성분 필터 조합 시 카드가 즉시 필터링, 검색창에 "VT" 입력 시 VT 리들샷만 표시

- [ ] **Step 4: 커밋**

```bash
git add js/view-sku.js js/app.js
git commit -m "feat: SKU intelligence view with multi-filter + favorites"
```

---

### Task 5: "Qoo10 Copycat 보드" 뷰

**Files:**
- Create: `js/view-copycat.js`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `DataStore.copycatShops`
- Produces: `renderCopycatView()` 함수 — `#view-copycat`에 벤치마킹 샵 카드 + 검색어 묶음 + 분석 항목 체크리스트 렌더링

- [ ] **Step 1: `js/view-copycat.js` 작성**

3개 섹션으로 구성:
1. **벤치마킹 샵 카드** (10개): 샵 유형, 주요 브랜드, 구색, 마케팅 특징, 페이지 심미성 평점, 예상 고객층, 강점/약점, Qoo10 검색 링크
2. **검색어 묶음**: 브랜드 검색어, 성분/효능 검색어, 카테고리 검색어 — 각각 클릭 시 Qoo10 검색 URL로 이동
3. **분석 항목 체크리스트**: MD 리포트 작성 시 확인할 10개 항목 (제목 구조, 대표 이미지 구성, 상세페이지 첫 화면, 가격/쿠폰/세트, 리뷰 언어, 따라할 것, 변형할 것, 버릴 것)

- [ ] **Step 2: `app.js` 라우터에 연결**

- [ ] **Step 3: 동작 확인**

Expected: 10개 샵 카드, 검색어 클릭 시 새 탭에서 Qoo10 검색 페이지 열림

- [ ] **Step 4: 커밋**

```bash
git add js/view-copycat.js js/app.js
git commit -m "feat: Qoo10 Copycat board with shop analysis + search links"
```

---

### Task 6: "성분 위키 + 국가별 주의사항 + 오프라인 소싱 루트" 뷰

**Files:**
- Create: `js/view-wiki.js` (성분 위키 + 국가별 주의사항을 하나의 모듈로)
- Create: `js/view-sourcing.js`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `DataStore.ingredients`, `DataStore.countries`, `DataStore.sourcingRoutes`
- Produces:
  - `renderWikiView()` — `#view-wiki`에 성분 위키 카드 렌더링
  - `renderCountryView()` — `#view-country`에 국가별 주의사항 렌더링
  - `renderSourcingView()` — `#view-sourcing`에 소싱 루트 렌더링

- [ ] **Step 1: `js/view-wiki.js` 작성 — 성분 위키 + 국가별 주의사항**

성분 위키: 12개 성분 카드. 각 카드에 성분 설명, 왜 뜨는가, 대표 SKU, 일본/대만 판매 적합성, 사용 가능 마케팅 표현, 조심할 표현.

국가별 주의사항: 일본/대만 2개 카드. 금지 성분, 표현 규제, 통관 체크리스트.

- [ ] **Step 2: `js/view-sourcing.js` 작성 — 오프라인 소싱 루트**

3개 권역(명동/성수/홍대) 카드. 각 권역별 목적, 체크할 것, 추천 매장 리스트, 방문 로그 입력 폼(날짜/매장/확인 SKU/가격/재고/사진 링크 → LocalStorage에 저장).

- [ ] **Step 3: `app.js` 라우터에 연결**

```javascript
if (viewId === 'view-wiki') renderWikiView();
if (viewId === 'view-country') renderCountryView();
if (viewId === 'view-sourcing') renderSourcingView();
```

- [ ] **Step 4: 동작 확인**

Expected: 성분 카드 12개, 국가 카드 2개, 소싱 루트 3개 권역 표시, 방문 로그 입력/저장

- [ ] **Step 5: 커밋**

```bash
git add js/view-wiki.js js/view-sourcing.js js/app.js
git commit -m "feat: ingredient wiki + country regulations + offline sourcing routes"
```

---

### Task 7: "경쟁사/인플루언서 레퍼런스 + Notion/Drive 링크" 뷰 + 최종 통합

**Files:**
- Create: `js/view-reference.js`
- Modify: `js/app.js` (Notion/Drive 링크 뷰 + 뱃지 카운트 + 최종 통합)

**Interfaces:**
- Consumes: `DataStore.skus`, `DataStore.actions`
- Produces:
  - `renderReferenceView()` — `#view-reference`에 경쟁사/인플루언서 레퍼런스 렌더링
  - 뱃지 카운트 업데이트 (`updateBadges()`)
  - Notion/Drive 링크 뷰

- [ ] **Step 1: `js/view-reference.js` 작성**

경쟁사 레퍼런스: Qoo10/Shopee 판매자 카드 (URL, 제목 구조, 가격, 적용할 점).
인플루언서 레퍼런스: TikTok/Instagram/YouTube 카드 (URL, 언급 SKU, 조회수, 마케팅 표현).

MD 분석 리포트 템플릿: 설계 문서 섹션 7의 템플릿을 그대로 화면에 표시 + "복사" 버튼.

- [ ] **Step 2: Notion/Drive 링크 뷰를 `app.js`에 인라인 구현**

```javascript
// view-links 섹션에 Notion/Drive 바로가기 렌더
function renderLinksView() {
  const el = document.getElementById('view-links');
  el.innerHTML = `
    <h2 class="page-title">🔗 Notion / Drive DB</h2>
    <p class="page-desc">깊은 자료는 Notion과 Google Drive에 누적합니다.</p>
    <div class="grid-2">
      <a href="https://app.notion.com/p/37744d5ca46c817db9f0e04cbf8b7c2c"
         target="_blank" class="card glass-panel" style="text-decoration:none;">
        <div class="card-title">📓 Notion DB</div>
        <p class="card-meta">SKU DB · 성분 위키 · 국가별 주의사항 · 매장 방문 로그 · 벤치마킹 DB</p>
      </a>
      <a href="https://drive.google.com/drive/folders/10d_wFsMKYxc8lPJ9AhtU8PF-u15IHp9e"
         target="_blank" class="card glass-panel" style="text-decoration:none;">
        <div class="card-title">📁 Google Drive</div>
        <p class="card-meta">MD 리포트 · 판매 페이지 스크린샷 · 매장 방문 사진 · SKU별 자료 폴더</p>
      </a>
    </div>
  `;
}
```

- [ ] **Step 3: 뱃지 카운트 업데이트 함수 추가**

```javascript
function updateBadges() {
  const incompleteActions = DataStore.actions.filter(a =>
    DataStore.getActionState(a.id) === '미완료'
  ).length;
  document.getElementById('badge-actions').textContent = incompleteActions;
  document.getElementById('badge-sku').textContent = DataStore.skus.length;
  document.getElementById('badge-copycat').textContent = DataStore.copycatShops.length;
}
```

`initApp()`에서 `DataStore.load()` 후 `updateBadges()` 호출.

- [ ] **Step 4: 모든 뷰 전환 + 데이터 로드 + 뱃지 통합 테스트**

Expected:
- 8개 메뉴 모두 클릭 시 해당 뷰 렌더
- 사이드바 접기/펼치기 동작
- 액션 상태 변경 → 새로고침 후 유지
- SKU 필터 동작
- 검색어 클릭 → Qoo10 새 탭
- Notion/Drive 클릭 → 해당 링크 새 탭
- 뱃지 카운트 정확

- [ ] **Step 5: 커밋 + 푸시**

```bash
git add js/view-reference.js js/app.js
git commit -m "feat: reference view + Notion/Drive links + badge counts + final integration"
git push origin main
```

---

## Verification Plan

### 수동 확인 (브라우저)
1. `index.html`을 브라우저에서 열어 모든 8개 뷰 전환 확인
2. 사이드바 접기/펼치기 → 새로고침 후 상태 유지
3. "오늘의 액션" 상태 변경 → 새로고침 후 유지
4. "SKU 인텔리전스" 필터 조합 테스트 (카테고리 + 상태 + 검색어)
5. "Qoo10 Copycat 보드" 검색어 클릭 → 새 탭에서 Qoo10 검색
6. "성분 위키" 12개 성분 카드 정확성
7. "국가별 주의사항" 일본/대만 규제 내용 확인
8. "오프라인 소싱 루트" 방문 로그 입력 → LocalStorage 저장 확인
9. "Notion/Drive DB" 링크 클릭 → 해당 서비스 이동
10. 뱃지 카운트 정확성 확인
