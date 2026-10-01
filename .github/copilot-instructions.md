# Project Workflow

For each task, work in this order: Understand, Plan, Implement, Test, Review, Commit.

## Scope and Planning

- Work on one small, independently verifiable feature or task at a time. Break broad requests into smaller tasks; do not attempt to build an entire application or layer in one pass.
- Prefer vertical slices that deliver a complete user flow across the UI, services, backend, and persistence as needed.
- Before implementation, read the relevant product, architecture, design, development-rule, security, and test-plan documents that exist (`docs/`). Identify unclear requirements and state the proposed scope and acceptance criteria.
- Use a structured task prompt when planning: CONTEXT, TASK, FILES, CONSTRAINTS, ACCEPTANCE CRITERIA, TESTING.
- Follow `TASKS.md` sequencing and project architecture. Do not expand a task into unrelated work.

## Implementation and Verification

- Implement only the agreed task scope, following existing patterns and reusing suitable components and services.
- Follow custom project rules located in `.copilot/rules/` (`general.mdc`, `frontend.mdc`, `backend.mdc`, `real-time.mdc`, `testing.mdc`).
- Test each feature using the relevant configured checks, such as lint, typecheck, unit, integration, end-to-end tests, or build. Do not claim a check passed unless it was run.
- Review the result against the applicable project documents for correctness, architecture, security, error handling, accessibility, responsiveness, performance, and duplication.
- Report review findings before fixing them. Address findings one at a time and rerun the relevant checks.

## Code Conventions & Guardrails

- Never hardcode API keys, tokens, or credentials; always utilize environment variables referenced in `.env.example`.
- Keep frontend components decoupled from direct WebSocket/WebRTC implementation details using dedicated service layers/hooks.
- Do not create duplicate helper functions or utility files if an equivalent exists in `src/utils/` or `src/services/`.

## Completion

- Update `TASKS.md` and `docs/MEMORY.md` only when acceptance criteria are met and relevant checks pass.
- Commit each completed task after testing and review.
- Report files changed, what was implemented, checks run and their results, and any remaining issues.