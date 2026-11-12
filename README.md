# WIDEN K-Beauty SKU Intelligence Dashboard

K-뷰티 해외 판매(Qoo10 JP 우선, Shopee TW 예정)를 위한 **SKU 중심 운영 대시보드**입니다.
빌드 도구 없이 `index.html` + 바닐라 JS + `data/*.json` 으로 동작하는 정적 SPA입니다.

## 실행 방법

> ⚠️ `index.html` 을 더블클릭(`file://`)으로 열면 브라우저 보안 정책 때문에 `data/*.json` 을 못 읽어서 모든 화면이 비어 보입니다.
> 반드시 아래처럼 로컬 서버로 여세요. (이 경우 화면 상단에 안내 배너가 뜹니다.)

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000` 접속. (`npm start` 도 같은 명령입니다.)

## 매주 데이터 업데이트

매주 월요일 08:47(한국시간) 예약 작업이 `docs/WEEKLY_UPDATE.md` 절차대로 리서치해서 `data: <주차> 주간 업데이트` PR 을 올립니다. 리뷰 후 머지하세요.
직접 할 때는 `npm run weekly`(롤오버) → 데이터 갱신 → `npm test`. 데이터 기준 주차는 첫 화면 제목 아래와 사이드바 하단에 표시됩니다.

## 테스트

```bash
npm test
```

- `tests/dashboard-static.test.mjs` — 핵심 함수/메뉴가 코드에 존재하는지 확인
- `tests/data-contract.test.mjs` — **JSON 키 이름이 코드가 읽는 이름과 맞는지** 확인. JSON 을 고치거나 시트에서 새로 뽑을 때 꼭 돌리세요.

## 화면 구성 (사이드바 순서)

| 메뉴 | 파일 | 데이터 |
|---|---|---|
| ⚡ 이번주 할일 | `js/view-cockpit.js` | actions, weekly-trends, platform-channels, season-calendar, weekly-uploads |
| 📦 카테고리/제품 | `js/view-sku.js` | sku-list |
| 🔍 벤치마킹샵 | `js/view-copycat.js` | copycat-shops |
| 🧪 성분/트렌드 | `js/view-wiki.js` | ingredients |
| 🌏 국가별 규제 | `js/view-wiki.js` | countries |
| 🏪 오프라인 소싱 | `js/view-sourcing.js` | sourcing-routes (+ 방문 기록은 LocalStorage) |
| 📋 경쟁페이지 분석 | `js/view-reference.js` | references (`"sample": true` 항목은 샘플 배지) |
| 🔗 데이터 관리 | `js/view-reference.js` | Notion / Drive 링크 (상수 `NOTION_URL`, `DRIVE_URL`) |

공통: `js/utils.js`(HTML 이스케이프, 링크, 날짜, 클립보드 등) → `js/data-store.js`(JSON 로딩 + LocalStorage) → 각 view → `js/app.js`(라우터) 순서로 로드됩니다.

## 검색 규칙 (모든 검색창 공통)

- 대소문자·전각/반각 무시 (`pdrn` = `PDRN`)
- 띄어쓰기로 나눈 단어가 **모두** 들어 있어야 일치 (`VT PDRN` = VT 이면서 PDRN)
- 띄어쓰기 차이 무시 (`리들샷100` → "리들샷 100")
- 필터 옵션(플랫폼·상태·주차·카테고리)은 실제 데이터에서 만들어지고 개수가 함께 표시됩니다. 데이터에 없는 옵션은 나오지 않습니다.

## 저장 위치

- **원본 데이터**: `data/*.json` (git 으로 관리)
- **제품 이미지**: 외부 `https://` 주소 또는 `images/` 폴더 (사용법: `images/README.md`)
- **체크 상태 · 즐겨찾기 · 방문 기록 · 국가별 체크리스트**: 브라우저 LocalStorage (`widen-*` 키).
  이 브라우저에만 저장되고 다른 PC·사람과 공유되지 않습니다. 브라우저 데이터를 지우면 사라집니다. 방문 기록은 `⬇️ CSV 내보내기` 로 백업하세요.
- **검색어 · 필터**: sessionStorage — 다른 메뉴에 갔다 와도 유지되고, 탭을 닫으면 초기화.

## 문서

- `docs/WEEKLY_UPDATE.md` — 주간 데이터 업데이트 절차
- `docs/CHANGELOG_리뷰_2026-11-10.md` — 2026-11-10 코드 리뷰에서 고친 것과 이유
- `docs/widen-kbeauty-dashboard-planning-v0.1.md` — 초기 기획
- `docs/benchmarking_strategy.md` — 벤치마킹 전략
- `docs/superpowers/specs/` — SKU 대시보드 설계 / 운영 매뉴얼 / 디자인 보강 스펙
- `docs/dev-log/` — 개발 로그, Codex 인수인계 노트
- `docs/reference/` — 작업 원칙, 과거 작업 레퍼런스 HTML
- `docs/archive/` — **현재 코드와 다른** 지난 v3 계획 문서 (보존용)
