# WIDEN Project Agent Contract

This repository follows the reusable AI Work OS described in `docs/ai/WORKFLOW.md`.

## Before implementation

- Read `docs/ai/README.md`, `docs/ai/project.yaml`, and the active task file under `docs/ai/plans/`.
- Confirm the user outcome, acceptance checks, risk level, and recommended model/reasoning in a plan before editing.
- Keep user decisions, implementation details, verification evidence, and learning notes in separate documents.

## Handoff contract

- The implementation agent must update `docs/ai/handoffs/*.yaml` with changed files, commands, risks, and the next action.
- The first verification must update `docs/ai/verification/*.md` with an explicit `PASS`, `FAIL`, or `BLOCKED` result.
- The second review must update `docs/ai/reviews/*.md` and must lead with actionable findings.
- A completion claim requires reproducible test or browser evidence. Do not treat a written plan as proof of implementation.

## Repository safety

- Do not put Supabase service keys, passwords, tokens, or private customer data in the repository.
- Keep production changes on a reviewed branch. Do not merge to `main` without explicit user approval.
- Prefer the existing static JavaScript architecture and `AppStorage` facade for dashboard changes.
- Use ASCII for new files unless Korean user-facing text or existing document encoding requires otherwise.

## Verification commands

```powershell
node tests/auth-session.test.mjs
node tests/app-storage.test.mjs
node tests/dashboard-static.test.mjs
node tests/scorecard-v1.test.mjs
```

When a task changes UI behavior, also verify the relevant menu, desktop width, and a 390x844 mobile viewport.

