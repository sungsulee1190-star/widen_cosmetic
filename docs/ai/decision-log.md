# AI Work OS Decision Log

## 2026-08-08 - Use a repository contract plus bootstrap template

- Context: The user works across multiple computers, AI tools, and unrelated projects.
- Decision: Keep the workflow contract in each repository and provide a bootstrap script for new repositories.
- Alternatives considered: Modify only the current repository; rely only on a global Codex instruction file; build a fully automatic cross-app agent orchestrator.
- Why: Repository files travel with GitHub and are visible to Antigravity, Claude, and GPT. The script makes new-project setup repeatable without overwriting existing project rules. Full cross-app wake-up is not available without an external event bridge.
- Owner: Sungsu Lee
- Revisit when: Antigravity or another tool exposes a reliable completion webhook.

## 2026-08-08 - Keep model routing risk-based

- Context: Model availability and subscription limits can change, while task risk is stable.
- Decision: Route by importance, difficulty, reversibility, and external-service impact; use the user's existing subscriptions first.
- Alternatives considered: Always use the strongest model; always use the fastest model; choose by project name.
- Why: This preserves quality on auth/data/deployment work while keeping routine documentation and small fixes efficient.
- Owner: Sungsu Lee
- Revisit when: Actual cost, latency, or failure data shows the routing matrix needs tuning.

## 2026-08-08 - Use Orca as the single orchestrator

- Context: Orca and Paseo are both available, but running two workspace managers would duplicate ownership and increase handoff ambiguity.
- Decision: Use Orca as the primary orchestrator. Keep Paseo optional and inactive for this workflow.
- Alternatives considered: Run both together; use Paseo as the primary; manage every stage manually.
- Why: Orca is the chosen worktree, terminal, handoff, artifact, and automation surface. The repository contract remains portable even when Orca CLI is unavailable.
- Owner: Sungsu Lee
- Revisit when: Orca CLI is connected and its stage-transition automation has completed one successful end-to-end run.
