# Codex Handoff Note - 2026-07-05

## 현재 상태

WIDEN K-Beauty SKU 중심 대시보드 재설계를 위해 브레인스토밍을 진행했고, 설계 초안 문서 2개를 생성했다.

생성된 파일:

- `docs/superpowers/specs/2026-07-05-widen-kbeauty-sku-dashboard-design.md`
- `docs/superpowers/specs/2026-07-05-widen-kbeauty-operations-manual.md`

## 합의된 핵심 방향

- 대시보드는 SKU 중심으로 재설계한다.
- 첫 화면은 `오늘의 액션`으로 둔다.
- 왼쪽에는 접이식 사이드바를 둔다.
- SKU별로 주간, 월간, 3개월, 6개월, 누적 기록을 쌓는다.
- 스테디셀러, 시즌성, 세일 의존 SKU, 급상승 SKU를 구분할 수 있어야 한다.
- 깊은 정보는 Notion과 Google Drive에 누적한다.
- 웹 대시보드는 요약, 필터, 체크, 링크 중심의 조종석 역할을 한다.
- 오프라인 소싱 루트는 명동, 성수, 홍대를 중심으로 잡는다.
- 성분 위키는 판매 판단과 마케팅 표현 중심으로 만든다.
- 국가별 판매 주의사항 위키를 별도로 둔다.
- Qoo10 JP를 첫 번째 Fast copycat 벤치마킹 채널로 삼는다.
- 경쟁 판매 페이지는 MD 리포트 형식으로 계속 찍어낼 수 있게 한다.

## Qoo10 Copycat 방향

초기 벤치마킹 대상은 공식 브랜드샵 위주로 본다.

- VT
- Anua
- Torriden
- manyo
- COSRX
- Medicube
- d'Alba
- numbuzin
- rom&nd
- Mediheal

이후 K-Beauty 전문 편집샵과 일본 종합 편집샵을 추가 조사한다.

## 커밋 시도 결과

사용자가 커밋을 요청했으나, 현재 `.git` 폴더에 쓰기 권한 문제가 있어 `git add`가 실패했다.

오류:

```text
fatal: Unable to create '.git/index.lock': Permission denied
```

확인 결과:

- `.git/index.lock` 파일은 존재하지 않았다.
- `.git` 폴더 ACL에 일부 쓰기 거부 권한이 있어 git 인덱스 갱신이 막힌 것으로 보인다.
- 따라서 설계 문서 파일은 생성되었지만 스테이징/커밋은 완료되지 않았다.

## 다음 작업자에게

Antigravity 또는 일반 터미널에서 이어받을 경우 먼저 아래 파일들을 확인한다.

1. `docs/superpowers/specs/2026-07-05-widen-kbeauty-sku-dashboard-design.md`
2. `docs/superpowers/specs/2026-07-05-widen-kbeauty-operations-manual.md`
3. 이 파일: `2026-07-05-codex-handoff-note.md`

그 다음 git 권한 문제가 해결되면 위 3개 파일을 커밋하면 된다.

권장 커밋 메시지:

```text
docs: add SKU dashboard redesign specs
```

## 아직 남은 설계 질문

- Notion DB 실제 속성명
- Google Drive 실제 폴더명
- 첫 샘플 SKU 10개
- 첫 Qoo10 편집샵 후보 2개
- Shopee 대만 조사 시작 시점
- 매장 방문 사진 촬영 규칙
- MD 리포트 파일명 규칙
