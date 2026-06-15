# AI Agent Instructions

## Scope
These instructions apply to this repository and are intended to help coding agents implement the Policy Benefits Calculator correctly and consistently.

## Read First
1. [CONTEXT.md](CONTEXT.md)
2. [Challenge Requirements](context/requirment.md)
3. [Working Prompt History](context/prompt.md)
4. [Project Context Notes](context/context.md)

Use links above as the source of truth. Do not duplicate those documents in code comments or generated docs.

## Project Status
Core engine is implemented. See [CONTEXT.md](CONTEXT.md) section 6 for details.
- `src/types/`, `src/calculator/`, `src/utils/`, `src/data/` are in place.
- `BenefitsCalculator.processExpenses()` is functional; output written via `npm start`.
- Unit tests in `tests/` are complete (18 tests). Next: README and GitHub submission.

## Implementation Priorities
Build in this order unless the user asks otherwise:
1. Data modeling (TypeScript interfaces/types)
2. Core calculation engine
3. Unit tests (at least 10)
4. Integration outputs and summary

## Non-Negotiable Business Rule Order
For each expense, apply rules in this exact sequence:
1. Exclusion
2. Waiting period
3. Deductible
4. Per-visit sub-limit
5. Copay
6. Annual limit cap
7. Decision and reason message

If the implementation changes this order, call it out explicitly because behavior will change.

## Calculation Behavior Requirements
- Process expenses chronologically by date ascending, regardless of input order.
- Maintain state across expenses (remaining annual limit, deductible consumed, and any per-benefit trackers).
- Provide a clear human-readable reason for every result, including denials and partial coverage.
- Prefer pure helper functions for individual rules and keep orchestration in one engine entrypoint.

## Testing Requirements
- Use isolated Jest tests with compact fixtures.
- Cover at minimum: normal coverage, waiting-period denial, deductible progression, copay, sub-limit cap, annual limit exhaustion, post-exhaustion denial, and chronological sort behavior.
- Keep tests deterministic and independent from large JSON fixtures when possible.

## Suggested Commands
When project scaffolding is present, use these commands:
- install dependencies: npm install
- run tests: npm test
- build: npm run build

If scripts are missing, add them in package.json before proceeding.

## Documentation Update Rule
After completing each major phase, update [CONTEXT.md](CONTEXT.md):
- Data design
- Core logic
- Unit tests
- Current progress and next steps

## Editing Guardrails
- Keep modules reusable and avoid hardcoded one-off script logic.
- Preserve existing naming and output shape required by [Challenge Requirements](context/requirment.md).
- Prefer small focused files over large monolithic implementations.
