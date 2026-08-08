# AI Work OS

This directory is the shared working contract for the user and AI agents on this project.

## Start here

1. Edit `project.yaml` with the project purpose, commands, risks, and deployment details.
2. Read `WORKFLOW.md` before planning or implementation.
3. Use `model-routing.md` to select the model and reasoning effort from task importance and difficulty.
4. Store plans, Handoffs, verification, reviews, learning, and logs in their matching directories.

## Conversation commands

- `새 프로젝트 시작`: create or refresh the project contract.
- `작업 시작: <goal>`: start interview and planning.
- `구현 시작: <task_id>`: start implementation from the approved plan.
- `검증 시작: <task_id>`: run first or second verification.
- `역설계: <task_id>`: document the finished structure and reuse recipe.

## Rules

- The user owns goals, scope, risk acceptance, and production decisions.
- GitHub plus `docs/ai` is the shared source of truth between tools.
- Do not claim completion without reproducible evidence.
- Mark external systems, deployment URLs, and account checks as `UNVERIFIED` until tested.

