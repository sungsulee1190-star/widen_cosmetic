# 05. 검증 기록

## 자동 테스트

```text
auth session checks passed
app storage checks passed
dashboard static checks passed
Scorecard-v1 and Decision Board tests passed successfully!
```

## 브라우저 테스트

- 초기 화면: 본문 렌더링, 메뉴 8개, 동기화 상태 바 확인
- `데이터 관리`: 활성 전환 및 링크 2개 확인
- `국가별 규제`: 활성 전환 및 본문 확인
- `카테고리/제품`: 활성 전환 및 제품 데이터 확인
- 오류 로그: 브라우저 error/warning 없음
- 모바일 390x844: `bodyScrollWidth`와 viewport 폭 동일

## 아직 필요한 운영 검증

- 실제 Vercel Preview URL 확인
- Supabase redirect allowlist 확인
- 같은 이메일로 Chrome/Edge 로그인
- 한 브라우저에서 action state를 바꾸고 다른 브라우저에서 새로고침
- 서로 다른 action state를 동시에 바꿔 덮어쓰기 여부 확인
