# 팀 공유 저장소(Supabase) 연결

작업 기록(할 일 상태 · 업로드 체크 · 즐겨찾기 · 방문 기록)을 팀이 함께 보려면:

1. Supabase 프로젝트의 SQL Editor에서 `supabase/migrations/001_work_log.sql`을 실행한다.
2. Project Settings → API에서 **Project URL**과 **publishable key**(`sb_publishable_...`, 또는 legacy anon key)를 복사한다. `service_role`/secret 키는 절대 쓰지 않는다.
3. 대시보드 → **데이터 관리** → 작업 기록 저장소에서 저장 위치를 "팀 공유"로 바꾸고 URL·키·작성자 이름을 넣고 **저장하고 다시 연결**.
4. 기존에 이 브라우저에 쌓인 기록이 있으면 **이 브라우저 기록을 공유 저장소로 복사**를 누른다(중복 복사되지 않음).

팀 전체 기본값으로 두려면 `js/workspace-config.js`의 `backend`, `supabase.url`, `supabase.key`를 채운다.

## 보안 메모

- 정책은 읽기·추가만 허용하고 수정·삭제는 막는다(append-only).
- publishable 키는 공개용이지만, 키와 URL을 아는 사람은 기록을 읽고 추가할 수 있다. 대시보드가 팀 밖에 공개될 경우 Supabase Auth 로그인을 붙이고 정책 대상을 `authenticated`로 좁힌다.
