# 주간 데이터 업데이트 절차

대시보드의 "이번 주" 데이터(트렌드, 업로드 계획, 할 일, 시즌)를 **매주 월요일** 갱신하는 절차입니다.
사람이 해도 되고, 예약된 Claude 작업(매주 월요일 오전)이 이 문서를 그대로 따라 PR 을 올립니다.

> 원칙: **출처 없는 숫자·순위는 쓰지 않는다.** 확인 못 한 것은 수치 없이 쓰거나 비워 둔다.

## 0. 준비

```bash
git checkout main && git pull
git checkout -b "data/weekly-$(date +%G-W%V)"
```

브랜치 이름은 `data/weekly-2026-W47` 처럼 이번 주 ISO 주차로.

## 1. 롤오버 (기계 작업)

```bash
npm run weekly        # = node scripts/weekly-rollover.mjs
```

- 지난주 트렌드·업로드·할 일을 `data/history/<지난주>/` 에 보관
- 지난주 트렌드·업로드에 나온 SKU 의 `weeklyHistory` 에 한 줄 추가 → '주차' 필터가 실제 기록으로 동작
- `data/meta.json` 을 이번 주로, `researchPending: true`
- 이미 이번 주면 아무것도 안 함 (두 번 돌려도 안전)

## 2. 리서치 → 데이터 갱신

| 파일 | 할 일 | 규칙 |
|---|---|---|
| `data/weekly-trends.json` | 이번 주 일본 판매 기준 트렌드 K-뷰티 SKU **3개**로 교체 | 각 항목에 `sources` (제목·URL·날짜) **2개 이상**. `whyTrending` 의 숫자·순위는 출처에 있는 것만. `imageUrl` 은 `""` 또는 `images/...` (외부 핫링크 금지). `links.qoo10` 은 Qoo10 JP 검색 URL |
| `data/sku-list.json` | 새 트렌드 제품이 없으면 추가. 기존 제품이면 `weeklyHistory` 에 이번 주 `{"week","signal":"트렌드","summary"}` | 가격·마진·경쟁 수는 확인한 것만. 모르면 필드를 빼 둠(화면엔 '—') |
| `data/weekly-uploads.json` | 이번 주 월~일 업로드 계획 7개 | `skuId` 는 `sku-list.json` 에 있는 id. 트렌드 SKU 우선 |
| `data/actions.json` | 이번 주 할 일 5~7개 | **새 id** (`act-2026w47-01` …). 같은 id 를 재사용하면 지난주 체크 상태가 따라옴 |
| `data/season-calendar.json` | 월이 바뀌었거나 세일 일정(Qoo10 메가와리 등)이 새로 발표됐으면 갱신 | 수요 판단이 추정이면 `currentMonth.basis` 에 근거를 적음. `metric` 은 출처 수치가 없으면 "상승"/"꾸준" |
| `data/meta.json` | `researchPending: false`, `sources` 에 이번 주 사용한 출처 전부, `updatedBy` | |

추천 출처: Qoo10 JP 랭킹·공식 공지, Qoo10 월간 코스메 랭킹 보도자료(value-press), 올리브영 랭킹, @cosme, WWD Japan, 일본 뷰티 매체. 로그인이 필요한 페이지는 쓰지 않음.

## 3. 확인

```bash
npm test
python3 -m http.server 8000   # http://localhost:8000 에서 첫 화면 확인
```

`npm test` 가 잡는 것: JSON 구조, 주차 형식, `researchPending: false` 인데 출처 없는 트렌드, 로컬 이미지 파일 누락, id 중복.

## 4. PR

- 제목: `data: 2026-W47 주간 업데이트`
- 본문: 이번 주 트렌드 3개와 핵심 근거 한 줄씩, 출처 목록, **확신이 낮은 항목**
- 리뷰 후 머지 → 대시보드를 연 사람은 `git pull` 하면 반영

## 화면에서 보이는 것

- 첫 화면 제목 아래: `📅 데이터 기준 2026-W47 · 11/16 업데이트 · 출처 8건`
- 이번 주보다 오래되면: `⚠️ 이번 주보다 N주 지났습니다`
- 롤오버만 하고 리서치 전이면: `⏳ 리서치가 아직 반영되지 않았습니다`
- 사이드바 하단: `데이터 2026-W47`
