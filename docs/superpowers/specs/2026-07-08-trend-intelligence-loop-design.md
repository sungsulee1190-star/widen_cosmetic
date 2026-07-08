# WIDEN Trend Intelligence Loop Design

작성일: 2026-07-08
상태: Claude Code 검증용 설계안
목적: WIDEN 대시보드가 단발성 화면이 아니라 "트렌드 발견 -> 분석 -> 검증 -> 축적 -> 추천 반영" 루프를 계속 돌리는 운영 시스템이 되도록 핵심 구조를 정의한다.

---

## 1. 핵심 목표

WIDEN의 핵심은 제품을 많이 보여주는 것이 아니라, 대표가 놓치기 쉬운 시장 신호를 잡고, 같은 기준으로 분석하고, 검증 근거를 남기고, 다음 추천에 반영하는 것이다.

운영 루프:

```text
시장 신호 수집
-> 트렌드 후보 생성
-> 점수 계산
-> 근거 검증
-> SKU/성분/브랜드/국가 DB에 연결
-> 이번 주 액션과 추천 제품에 반영
-> 결과 기록
-> 다음 주 판단에 재사용
```

성공 기준:

- 추천 제품이 왜 추천됐는지 근거가 보인다.
- 근거가 없는 제품은 "추천"이 아니라 "관찰 필요"로 남는다.
- 오래된 데이터는 자동으로 신뢰도가 낮아진다.
- 카테고리, 성분, 국가, 플랫폼이 바뀌어도 같은 로직으로 판단된다.
- 코드 수정 후에도 테스트가 핵심 루프를 깨뜨렸는지 잡아낸다.

---

## 2. 지금 놓치기 쉬운 것

### 2.1 근거 품질 등급

현재 데이터에는 링크와 메모가 있지만, 근거의 강도가 구분되지 않는다.

예시:

- 공식몰 가격 확인
- Qoo10 검색 결과 상위 노출
- Shopee 판매량/리뷰 확인
- 인플루언서 언급
- 오프라인 품절 확인
- 대표의 직관 메모

이들은 같은 무게가 아니다. 모든 신호에는 `evidenceGrade`가 필요하다.

권장 등급:

- A: 공식몰, 플랫폼 상품 페이지, 실제 판매/리뷰/랭킹 캡처
- B: 플랫폼 검색 결과, 복수 셀러 반복 노출, 오프라인 사진
- C: SNS/콘텐츠 언급, 커뮤니티 반응, 키워드 검색 증가
- D: 내부 가설, 미검증 메모

### 2.2 검증 상태

제품은 단순히 `트렌드`, `스테디`가 아니라 검증 단계가 있어야 한다.

권장 상태:

- discovered: 발견됨
- analyzing: 분석 중
- needsEvidence: 근거 부족
- verified: 검증 완료
- testReady: 테스트 판매 가능
- watching: 관찰 유지
- blocked: 규제/소싱/마진 문제로 보류
- rejected: 제외

### 2.3 데이터 신선도

뷰티 트렌드는 빨리 낡는다. 3개월 전 Qoo10 랭킹과 어제 다이소 품절은 같은 가치가 아니다.

각 신호에는 아래 필드가 필요하다.

- observedAt
- sourceType
- sourceUrl
- expiresAt 또는 freshnessDays
- stalePenalty

기본 규칙:

- 플랫폼 랭킹/가격: 14일 후 감점
- SNS 바이럴: 30일 후 감점
- 성분/규제 지식: 90~180일 후 재확인
- 오프라인 재고: 7일 후 재확인

### 2.4 추천 로직의 재현성

추천은 "느낌"이 아니라 재계산 가능해야 한다.

각 SKU 추천 결과에는 다음이 남아야 한다.

- trendScore
- scoreBreakdown
- appliedRules
- missingEvidence
- recommendationReason
- nextAction

### 2.5 국가별 차이

일본에서 뜨는 제품과 대만에서 뜨는 제품은 다를 수 있다.

SKU 점수는 전체 점수 하나가 아니라 국가별 점수를 가져야 한다.

- japanScore
- taiwanScore
- japanRisks
- taiwanRisks
- japanKeywords
- taiwanKeywords

### 2.6 실패 기록

팔리지 않은 제품도 자산이다. 실패 이유가 쌓이지 않으면 같은 실수를 반복한다.

필요한 실패 로그:

- 가격 경쟁 실패
- 소싱가 문제
- 경쟁 셀러 과다
- 이미지/상세페이지 약함
- 규제 표현 문제
- 리뷰/신뢰 부족
- 트렌드가 너무 빨리 꺼짐

### 2.7 자동화 전 사람의 검증 게이트

완전 자동 추천은 위험하다. MVP에서는 사람이 확인할 수 있는 게이트가 있어야 한다.

추천 단계:

```text
자동 점수 계산
-> 근거 부족 표시
-> 대표 검토
-> testReady 승인
-> 액션 생성
```

---

## 3. 데이터 모델

### 3.1 Trend Signal

시장 신호 하나를 나타낸다.

필드:

- id
- observedAt
- signalType: platformRanking, platformSearch, marketplaceProduct, socialMention, offlineObservation, officialProduct, competitorPage, regulation, internalMemo
- market: japan, taiwan, korea, global
- platform: Qoo10 JP, Shopee TW, Amazon JP, Olive Young, Musinsa, Daiso, TikTok, Instagram, YouTube
- keyword
- brand
- skuName
- ingredient
- category
- sourceUrl
- sourceTitle
- evidenceGrade: A, B, C, D
- confidence: 0~100
- freshnessDays
- rawObservation
- relatedSkuIds
- relatedIngredientIds
- relatedBrandIds
- nextVerificationAction

### 3.2 Verification Log

신호를 검증한 기록이다.

필드:

- id
- signalId
- verifiedAt
- method: pageCheck, screenshot, priceCheck, reviewCheck, offlineVisit, sourceComparison, regulationCheck
- result: confirmed, contradicted, inconclusive, stale
- verifiedBy
- evidenceUrl
- driveAssetUrl
- note

### 3.3 Trend Score Rule

점수 계산 규칙이다.

필드:

- id
- name
- weight
- appliesTo
- positiveCondition
- negativeCondition
- maxScore
- stalePenalty
- explanation

초기 규칙:

- 플랫폼 상위 노출
- 반복 셀러 노출
- 리뷰/판매량 근거
- 성분 트렌드 적합성
- 경쟁 강도
- 마진 가능성
- 오프라인 확인
- 국가별 규제 리스크
- 상세페이지 차별화 가능성

### 3.4 Recommendation

이번 주 추천 결과다.

필드:

- id
- week
- skuId
- market
- trendScore
- evidenceScore
- marginScore
- competitionScore
- regulationRiskScore
- finalRecommendation: testNow, verifyMore, watch, block, reject
- recommendationReason
- missingEvidence
- nextAction
- generatedAt

---

## 4. 화면 반영

### 4.1 이번주 할일

추천 결과에서 nextAction을 생성한다.

예:

- Qoo10 JP에서 PDRN 세럼 상위 5개 상세페이지 캡처
- Shopee TW에서 히알루론산 세럼 가격/판매량 확인
- 다이소 명동점에서 VT 리들샷 재고 재확인
- 조선미녀 PDRN 세럼 상세페이지 문구 구조 분석

### 4.2 카테고리/제품

카테고리를 누르면 해당 카테고리의 추천 SKU와 검증 상태가 바뀐다.

상세 패널에는 다음을 보여준다.

- 추천 이유
- 점수 Breakdown
- 부족한 근거
- 다음 검증 액션
- 관련 성분/브랜드/경쟁페이지

### 4.3 성분/트렌드

성분 설명만 보여주지 않는다.

각 성분에 다음을 보여준다.

- 일본/대만 판매 적합도
- 대표 SKU
- 잘하는 브랜드
- 가격대
- 위험 표현
- 추천 상세페이지 키워드
- 최근 신호

### 4.4 경쟁페이지 분석

경쟁페이지는 단순 링크가 아니라 Trend Signal과 Verification Log의 근거가 된다.

각 분석에는 다음을 저장한다.

- URL
- 캡처 여부
- 제목 키워드
- 대표 이미지 구조
- 가격/쿠폰/세트
- 리뷰 반복 표현
- 따라 할 점
- 변형할 점
- 피할 점

### 4.5 데이터 관리

Notion/Google Sheet/Drive 연결 상태를 보여준다.

초기 MVP에서는 웹 대시보드의 JSON을 원본처럼 사용하되, 구조는 Notion DB로 이전 가능한 필드명으로 맞춘다.

---

## 5. Notion / Google Sheet 역할

권장 구조:

- Notion: 운영 DB와 관계형 연결의 원본
- Google Sheet: 대량 입력/정렬/가격 비교 작업용 보조 테이블
- Drive: 이미지, 캡처, 리포트 원본
- 웹 대시보드: 판단과 액션 화면

초기에는 Google Sheet보다 Notion을 중심에 둔다. 이유는 SKU, 성분, 브랜드, 경쟁페이지, 검증 로그의 관계 연결이 중요하기 때문이다. 가격 비교처럼 행 단위 작업이 커지면 Sheet를 보조로 붙인다.

---

## 6. Claude Code 검증 포인트

Claude Code가 이 계획을 검증할 때 확인할 질문:

1. 추천 결과가 하드코딩된 제품명에 의존하지 않는가?
2. 신호, 검증 로그, 추천 결과가 분리되어 있는가?
3. 오래된 데이터가 점수에 계속 같은 영향력을 주지 않는가?
4. 카테고리 필터가 상세 추천, 카드 목록, 액션 생성에 동시에 반영되는가?
5. 근거 없는 추천이 testReady로 올라가지 않는가?
6. 일본/대만 시장 차이가 데이터 모델에 들어가 있는가?
7. 새 성분이나 새 플랫폼을 추가할 때 기존 화면을 크게 고치지 않아도 되는가?
8. 테스트가 핵심 루프를 깨뜨리는 변경을 잡아내는가?

---

## 7. 결론

WIDEN이 앞으로 놓치면 안 되는 것은 "추천 제품 목록"이 아니라 "추천이 만들어지는 과정"이다.

제품은 계속 바뀐다. PDRN, 히알루론산, 리들샷, 붉은팥 다음에는 또 다른 성분과 브랜드가 온다. 따라서 시스템은 특정 제품에 최적화되면 안 되고, 어떤 신호가 들어와도 같은 방식으로 검증하고 축적하고 추천할 수 있어야 한다.

