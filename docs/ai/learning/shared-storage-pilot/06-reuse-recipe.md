# 06. 재사용 레시피

비개발자가 다음 작업을 반복할 때의 순서:

1. 변경할 화면과 데이터의 이름을 한 문장으로 적는다.
2. 그 데이터가 정적 기준인지 사용자가 수정하는 상태인지 나눈다.
3. 수정 상태라면 공유 키 또는 개별 레코드 ID를 먼저 정한다.
4. 화면 이벤트 -> DataStore -> AppStorage -> Supabase 순서로 연결한다.
5. 자동 테스트를 먼저 실패시키고 구현 후 통과시킨다.
6. 데스크톱 초기 로딩, 메뉴 전환, 모바일 폭, 원격 실패 상태를 확인한다.
7. Antigravity 1차 검증 결과를 Handoff 카드에 기록한다.
8. GPT 2차 검토에서는 PASS보다 먼저 운영 차단 요인을 적는다.

## 다음 단계로 옮길 때

메모, 루틴, 링크처럼 여러 항목이 동시에 수정되는 데이터는 배열 하나로 저장하지 않는다. 다음 설계에서는 다음과 같은 개별 행을 사용한다.

```text
workspace_records
- owner_id
- workspace
- record_type: memo | routine | link | candidate
- record_id
- payload: jsonb
- updated_at
```

이 구조가 되면 Chrome과 Edge가 서로 다른 항목을 동시에 수정해도 전체 배열을 덮어쓰는 위험이 줄어든다.
