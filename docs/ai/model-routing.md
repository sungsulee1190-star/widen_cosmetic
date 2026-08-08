# Model and Reasoning Routing

모델은 이름보다 작업 위험과 난이도를 기준으로 선택합니다. 사용자의 기존 구독 모델을 우선 사용하고, 별도 API 키나 새 유료 서비스를 전제로 하지 않습니다.

## Default role assignment

| Stage | Default model role | Default reasoning | Why |
| --- | --- | --- | --- |
| Interview | conversational GPT or Claude | medium | clarify user outcome without premature implementation |
| Plan | Claude | high or xhigh | architecture, scope, trade-offs, and acceptance checks |
| Implementation | Antigravity coding model | medium for P2, high for P1/P0 | execute the approved plan and run local checks |
| First verification | Antigravity coding model | high | reproduce the implementation context and catch obvious regressions |
| Second verification | GPT | high for P1, xhigh for P0 | independent review, browser evidence, and risk judgment |
| Learning | GPT | medium | explain the result in beginner-friendly language |

## Priority and difficulty matrix

| Priority | Typical work | Plan | Implement | Verify |
| --- | --- | --- | --- | --- |
| P0 critical | auth, payments, data loss, production migration | Claude xhigh | Antigravity high | GPT xhigh |
| P1 important | shared storage, user-facing workflow, deployment | Claude high | Antigravity high | GPT high/xhigh |
| P2 normal | isolated feature, styling, documentation | Claude medium | Antigravity medium | GPT medium/high |
| P3 low | copy, formatting, local cleanup | Claude low/medium | Antigravity low/medium | GPT low |

Increase one level when any of these are true: the change crosses module boundaries, affects multiple browsers, touches external services, has no automated test, or the user cannot easily undo it.

## Task declaration

Every non-trivial task starts from `templates/task.yaml` with:

- `importance`: P0-P3
- `difficulty`: 1-5
- `risk`: data, auth, deployment, UX, or none
- `acceptance`: observable checks, not intentions
- `recommended_models`: stage-specific recommendation

If importance and difficulty disagree, route to the higher-risk setting. Never use a fast model to make an irreversible production decision.

