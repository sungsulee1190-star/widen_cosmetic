# Shared Storage Pilot: GPT 2차 검토

검토 상태: `PARTIAL_PASS`

## Findings

### [P1] 운영 URL의 Auth redirect allowlist 미확인

현재 세션에서는 Vercel 커넥터가 팀/프로젝트 목록을 반환하지 않아 실제 Preview 및 Production URL을 확인하지 못했다. Supabase Auth의 Site URL과 Additional Redirect URLs에 실제 Vercel 도메인을 넣지 않으면 매직 링크 로그인 후 돌아오지 못할 수 있다.

### [P1] Chrome/Edge 실계정 동기화 미완료

인증된 두 브라우저 세션을 사용할 이메일과 배포 Preview URL이 현재 검증 환경에 없어, RLS를 통과한 실제 교차 브라우저 read/write는 아직 증명하지 못했다. 로컬 브라우저에서는 로그인 필요 상태와 fallback UI까지 확인했다.

### [P2] 동시 편집은 전체 컬렉션 last-write-wins

현재 `AppStorage`는 키 하나에 배열 또는 객체 전체를 저장한다. 두 브라우저가 같은 키를 동시에 수정하면 한쪽 변경이 덮어써질 수 있다. 파일럿 범위에서는 위험으로 기록하고, 메모/루틴/링크/상품 후보를 `workspace_records` 개별 행으로 이전하는 후속 작업에서 해결한다.

## Verified

- Supabase `app_state` table exists with `(owner_id, id)` primary key.
- RLS select/insert/update/delete policies restrict rows to `auth.uid() = owner_id`.
- Frontend contains only the public publishable key; no service role key is present.
- Auth, AppStorage, dashboard static, and scorecard tests pass.
- Local browser initial page and `데이터 관리`, `국가별 규제`, `카테고리/제품` menu rendering pass.
- Mobile 390x844 check has `bodyScrollWidth == viewportWidth` after the responsive fix.
- Runtime browser logs had no error or warning entries during the checks.

## Decision

코드 파일럿은 검증 가능한 상태다. 운영 반영 완료로 표시하려면 Antigravity 1차 검증에서 실제 Preview URL과 같은 계정의 Chrome/Edge/mobile 동기화를 확인해야 한다.
