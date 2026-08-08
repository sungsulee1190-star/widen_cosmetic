# AI Work OS

이 디렉터리는 사람과 AI가 같은 프로젝트를 이어서 작업하기 위한 공통 작업 계약입니다.

## 시작점

1. `project.yaml`에서 프로젝트 목적, 실행 명령, 위험 경계를 확인합니다.
2. `WORKFLOW.md`에서 현재 작업 단계와 산출물 계약을 확인합니다.
3. `model-routing.md`에서 중요도·난이도에 맞는 모델과 추론 강도를 선택합니다.
4. 활성 작업은 `plans/`, 전달 문서는 `handoffs/`, 검증 결과는 `verification/`, GPT 리뷰는 `reviews/`에 기록합니다.
5. 완료 후 `learning/`과 `work-log.md`에 구조와 재사용 방법을 남깁니다.

## 대화 명령

- `새 프로젝트 시작`: 프로젝트 설정과 작업 계약을 만듭니다.
- `작업 시작: <목표>`: 인터뷰와 계획 수립을 시작합니다.
- `구현 시작: <task_id>`: 계획을 읽고 구현 단계로 이동합니다.
- `검증 시작: <task_id>`: 1차 또는 2차 검증을 실행합니다.
- `역설계: <task_id>`: 완료된 작업을 구조도와 재사용 레시피로 정리합니다.

## 핵심 원칙

- 사용자가 목표와 의사결정의 소유자입니다.
- GitHub 브랜치와 `docs/ai`가 작업의 공유 저장소입니다.
- 각 단계는 다음 단계가 바로 이해할 수 있는 짧은 Handoff를 남깁니다.
- 테스트·브라우저·배포 확인 결과가 없으면 완료로 표시하지 않습니다.
- 비로그인·네트워크 실패·외부 서비스 미연결 상태를 숨기지 않습니다.

## 현재 프로젝트

- 설정: [`project.yaml`](project.yaml)
- 전체 흐름: [`WORKFLOW.md`](WORKFLOW.md)
- 모델 선택: [`model-routing.md`](model-routing.md)
- 현재 파일럿 Handoff: [`handoffs/shared-storage-pilot.yaml`](handoffs/shared-storage-pilot.yaml)

새 저장소에는 이 프로젝트의 `tools/init-ai-workflow.ps1`를 실행해 같은 계약을 설치합니다.

