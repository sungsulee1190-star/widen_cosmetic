# Model and Reasoning Routing

Use existing user subscriptions first. Route by risk and difficulty, not by project name.

| Priority | Typical work | Plan | Implement | Verify |
| --- | --- | --- | --- | --- |
| P0 critical | auth, payments, data loss, production migration | Claude xhigh | Antigravity high | GPT xhigh |
| P1 important | shared storage, user-facing workflow, deployment | Claude high | Antigravity high | GPT high/xhigh |
| P2 normal | isolated feature, styling, documentation | Claude medium | Antigravity medium | GPT medium/high |
| P3 low | copy, formatting, local cleanup | Claude low/medium | Antigravity low/medium | GPT low |

Increase one level when the change crosses modules, affects multiple browsers, touches an external service, has no automated test, or cannot be easily undone.

Every non-trivial task declares `importance`, `difficulty`, `risk`, `acceptance`, and `recommended_models` in `templates/task.yaml`.

