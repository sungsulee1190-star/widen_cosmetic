# 03. 코드 지도

| 파일 | 역할 |
| --- | --- |
| `index.html` | Supabase CDN, 설정, 인증, 저장소, DataStore, 화면 순서 |
| `js/storage-config.js` | Supabase URL과 공개 publishable key |
| `js/auth-session.js` | 매직 링크 로그인과 현재 사용자 ID |
| `js/app-storage.js` | 원격 read/write, localStorage fallback, 상태 표시값 |
| `js/data-store.js` | 정적 JSON과 사용자 변경 상태를 화면 API로 연결 |
| `js/app.js` | 로그인 상태 변화, 메뉴, 배지, 동기화 상태 UI |
| `supabase/migrations/001_shared_state.sql` | `app_state` 테이블과 RLS 정책 |
| `tests/auth-session.test.mjs` | 인증 facade 단위 검증 |
| `tests/app-storage.test.mjs` | 원격 상태와 DataStore 연결 검증 |

## 빠른 역설계 순서

1. 화면에서 값을 바꾸는 이벤트를 찾는다.
2. 이벤트가 `DataStore.set*`를 호출하는지 본다.
3. `DataStore.setSharedState`가 `AppStorage.set`으로 가는지 본다.
4. `AppStorage`가 인증된 `owner_id`로 upsert하는지 본다.
5. RLS가 같은 `owner_id`만 허용하는지 확인한다.
