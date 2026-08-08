# Shared Storage Pilot: Antigravity 1차 검증

상태: `PENDING`

## 검증 순서

1. `codex-trend-intelligence-loop` 브랜치 checkout 확인
2. 아래 테스트 실행

```powershell
node tests/auth-session.test.mjs
node tests/app-storage.test.mjs
node tests/dashboard-static.test.mjs
node tests/scorecard-v1.test.mjs
```

3. 로컬 또는 Preview URL에서 다음을 확인

- 첫 화면에 빈 화면이나 JavaScript 오류가 없다.
- `국가별 규제`, `데이터 관리` 메뉴가 실제 내용을 렌더링한다.
- 로그인 전 상태가 `로그인 필요`로 표시된다.
- 모바일 폭에서 가로 스크롤이 페이지 전체로 번지지 않는다.
- 같은 계정으로 로그인한 두 브라우저에서 action state, favorite, 후보 상품 변경이 보인다.
- 네트워크 실패 시 `LOCAL_FALLBACK` 또는 오류 상태가 표시된다.

## 기록 양식

```text
결과: PASS | FAIL | BLOCKED
테스트 시각:
브라우저/기기:
Preview URL:
실패 항목:
재현 절차:
스크린샷 또는 콘솔 오류:
다음 조치:
```

## 주의

- Supabase `service_role` 키는 브라우저나 저장소에 넣지 않는다.
- 같은 컬렉션을 두 브라우저가 동시에 수정하는 경우 마지막 전체 배열 저장이 이길 수 있다. 이 문제가 재현되면 `workspace_records` 개별 행 저장 작업으로 전환한다.
