# WIDEN 도메인 용어

대시보드 코드와 대화에서 쓰는 이름. 새 개념이 생기면 여기에 먼저 적는다.

- **SKU** — 소싱·판매를 검토하는 개별 제품. `data/sku-list.json`의 한 행이며 `id`(`sku-...`)로만 식별한다. 표시 이름은 바뀔 수 있으므로 참조 키로 쓰지 않는다.
- **SKU 레코드** — SKU 하나에 연결된 모든 것(업로드 계획, 주간 트렌드, 할 일, 성분, 관찰)을 모아 보는 단위. `SkuCatalog.createRecords()`가 만들고, 화면은 `DataStore.skuRecords()`로 받는다. `get / list / resolve / linked / timeline / history / unresolved` 외의 방법으로 SKU를 찾지 않는다.
- **관찰(observation)** — 특정 날짜에 SKU에 대해 확인한 사실 한 건. `{ skuId, date: 'YYYY-MM-DD', kind, source, summary }`. kind: `offline-visit`(현장 확인), `weekly-pick`(주간 추천), `trend`, `note`. 출처는 `data/observations.json`과 오프라인 소싱 방문 기록.
- **기간별 기록** — 관찰을 1주 / 1개월 / 3개월 / 6개월 / 누적으로 센 것. **날짜 없는 관찰은 세지 않는다**(이력을 지어내지 않는다).
- **판정(signal)** — 기간별 기록에서 계산한 상태: `스테디 후보`(6개월 중 6주 이상 + 최근 1개월 관찰), `급상승 후보`(최근 1개월에 집중), `관찰 중`, `기록 부족`. 데이터 원본의 `status`(트렌드/스테디/시즌성)는 사람이 붙인 라벨이고, 판정은 기록에서 나온 값이다.
- **대분류** — 카테고리 레일의 분류(스킨케어, 선케어, 립…). 원본의 세부 `category`(세럼/앰플, 토너…)에서 매핑한다. 매핑에 없으면 `기타`.
- **인기점수** — 6개 요소(플랫폼 랭킹, 반응, 예상 판매량, 오프라인 신호, 마진, 경쟁 강도)를 사용자가 정한 비중으로 합친 0–100 점수.
- **할 일 범위** — 할 일(`actions.json`)은 `skuIds`로 대상 SKU를 가리키거나 `scope: "all"`로 전 SKU를 가리킨다.
- **작업 기록(work log)** — 사람이 대시보드에서 한 일: 할 일 상태, 업로드 체크, 즐겨찾기, 방문 기록. `WorkLog`(js/work-log.js)가 관리하며 모든 변경은 **append-only 항목** `{ id, kind, key, data, at, by }`으로 쌓인다. 현재 상태 = kind+key별 가장 최근 항목. 지우거나 고치지 않으므로 누가 언제 바꿨는지 남는다.
- **저장 위치(adapter)** — 작업 기록을 어디에 두는가. `auto`(기본: 대시보드를 연 주소에 WIDEN 서버가 있으면 공유, 없으면 이 브라우저), `server`(WIDEN 서버, 예: 맥미니 — `server/server.mjs`, 파일 `var/work-log.jsonl`), `supabase`, `local`(이 브라우저 localStorage). '데이터 관리' 화면에서 바꾼다. 공유 저장소에 연결하지 못하면 이 브라우저에 저장하고 사이드바에 경고를 띄운다.
- **WIDEN 서버** — 대시보드 파일을 내보내고 `/api/work-log`로 작업 기록을 받는 의존성 없는 Node 서버. 팀 공유의 기본 경로. 접속 코드(`WIDEN_TOKEN`)를 설정하면 그 코드를 아는 사람만 기록을 읽고 쓴다. 설치: `docs/mac-mini-server.md`.
