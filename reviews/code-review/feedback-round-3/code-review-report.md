# Asset 360 — Flows code review

This document is the platform review for Asset 360, conducted as part of the Cognite Flows app certification process.

Round 3. Supersedes round 2 (`feedback-round-2/`), which predates the error boundaries, the concurrency cap, the paging and the server-side sort.

## Path to approval

This review found **0 must-fix item(s)** that block approval. Three should-fix and seven nice-to-fix items remain open; none blocks approval.

### Reviewed commit
`3c89a3ada1512b7525b1b568d550995fc2bb200f`

## Checks performed

- `flows-review-checks` and `code-quality` pulled from `cognitedata/builder-skills` with `npx @cognite/cli@latest apps skills pull` (both succeeded) and read in full before scoring.
- Hunt (Step 1): every search in `flows-review-checks` 1.1–1.5 was run from the app root. Results in `review-findings.md`.
- `code-quality` searches were run; its fix steps were not applied.
- `npm run lint`: no errors, no warnings.
- `npx tsc --noEmit`: no errors.
- `npx vitest run --coverage`: 37 files, 339 tests, all passing.
- Package audit (Step 2): `npm outdated --json`, `npm audit --json`, and `npm view` for flagged packages. Results in `review-packages.md`.
- Coverage config read: `vitest.config.ts`.

## Coverage scope

- Config: `vitest.config.ts`. `coverage.include: ['src/**/*.{ts,tsx}']`.
- Excluded from measurement: `src/**/*.test.{ts,tsx}`, `src/**/*.d.ts`, `src/main.tsx`. These are the allowed excludes.
- Not excluded: `src/__mocks__/*` (test helpers, measured, lowering the total slightly). See N7.
- Tests excluded from the run: none.
- Measured: statements 97.98%, branches 94.73%, functions 96.44%, **lines 98.31%** (467/475), over all of `src/`.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 4 | No TODO or FIXME. Error boundaries at app and section level. Every fetch has loading, error and empty states. Every `useEffect` has cleanup. One latent state issue (`AppStateProvider.tsx:25-33`, N1), not reachable from any current path. |
| User & customer | 1.3 Packages | 3 | No critical or high CVEs; no deprecated production package. Moderate CVE in dev-only vitest with a patch fix in 4.1.11 (N2). `@cognite/aura` and `react` one major behind; `@tanstack/react-table` one major behind; `@cognite/app-sdk` two minors behind on 0.x. No upgrade plan written down (S1). |
| User & customer | 1.4 Tests & coverage | 5 | 98.31% line coverage over the full `src/` scope, with only the allowed excludes. All 37 test files run. Every production module with logic has a matching test; the three files without one are context objects and an entry point (see `review-files.md`). |
| User & customer | 1.5 Dead code | 5 | No unused production files, no TODO or FIXME, no `console.*`, lint and tsc clean, no `any`, no component over 150 lines (largest 116). |
| User & customer | 1.6 Patterns & testability | 5 | DI via context: view models call `useAppDeps()`; services are interfaces with `Cdm*` classes implementing them; `TaskRunner` injected; no `new CogniteClient` outside tests. No `vi.mock(` calls; tests inject fakes through `makeDeps` and `makeViewModelWrapper`. Feature folders stand in for `src/hooks/` and `src/pages/`. |
| Cognite services | 2.1 DMS query patterns | 4 | Asset lookup by tag uses `instances.search`; activities, files and time series use `instances.list` with filters and sorts, which is the right tool for a filtered, sorted list. The time series listing and its unit lookup could be one `instances.query` (N3). |
| Cognite services | 2.2 Server-side filter | 4 | Filters, sorting and limits are sent to the API: activities sorted server-side, search limited to 50, files cursor-paged. Time series walk up to 1000 nodes with a silent cap (N4). |
| Cognite services | 2.3 Limits & pages | 3 | Every list has a limit or cursor. Activities "Load more" re-requests every earlier row with a growing limit: reaching 500 downloads about 5,250 rows in total (S2). This is the cost of sorting without a DMS index, which the project does not have. |
| Cognite services | 2.4 Call rate | 4 | Shared concurrency cap of 4 across all services (`createAppDeps.ts:16,21`). No polling. `staleTime` 5 minutes. Refresh is user-triggered. Load more repeats earlier rows (N5, same root as S2). |
| Cognite services | 2.5 429 backoff | 3 | Concurrency cap in place. No 429 or `Retry-After` handling, no jitter. Only TanStack Query's default retries apply (S3). |
| Cognite services | 2.6 CDF Raw | N/A | No `client.raw` or Raw-related calls found. |
| Brand | 3.1 Aura | 4 | 13 production files import Aura; no hard-coded colours; no hex or rgb values in `src/`. Search uses Popover and Command, which Aura's Combobox cannot do for server-side search, so the composition is justified. Files table column sizing not re-checked this round (N6). |

## Summary

Must Fix: 0. Should Fix: 3. Nice to Fix: 7.

### Must Fix

None.

### Should Fix (score 3)

- **S1 — Outdated production dependencies, no upgrade plan (1.3).** `@cognite/aura` 0.3.5 (latest 1.x), `react` / `react-dom` 18.3.1 (latest 19.3.0), `@tanstack/react-table` 8.21.3 (latest 9.2.8), `@cognite/app-sdk` 0.9.0 (latest 0.11.0). Write down an upgrade plan, or upgrade. Aura is the one with the most risk, since the low CVEs come in through it.
- **S2 — Activities "Load more" re-downloads the whole list (2.3).** `src/features/activities/useActivitiesViewModel.ts:39-43`. The limit grows 25 at a time to 500, so each page resends every earlier row. Reaching 500 takes 20 requests and about 5,250 rows. Options: accept and document it as the cost of no index; or ask for an index on the activity sort key, which would allow a cursor. _Not a must-fix: the cap bounds the cost to a known ceiling._
- **S3 — No 429 or `Retry-After` handling (2.5).** The concurrency cap (4) exists. Add a retry on 429 that honours `Retry-After`, with jitter and a bounded number of attempts, in the shared runner (`src/lib/taskRunner.ts`), so every service gets it.

### Nice to Fix (score 4 gaps and small items)

- **N1 — Stale-state update (1.1).** `src/state/AppStateProvider.tsx:25-33`: `update` builds from the last render's state, so two updates in one event lose the first patch. No current path hits it. Fix by reading the latest state through a functional `setState`.
- **N2 — Vitest moderate advisory (1.3).** Upgrade `vitest`, `@vitest/coverage-v8` and `@vitest/ui` to 4.1.11 (patch). Same change as the open item from round 2.
- **N3 — Time series listing could be one query (2.1).** `src/services/RelatedDataService.ts:58-80`: list plus unit lookup could be one `instances.query`.
- **N4 — Silent cap on time series (2.2).** `src/services/RelatedDataService.ts:49,108-116`: 1000-node cap with no message when hit. Consider a "showing the first 1000" note, as the search hint does.
- **N5 — Load more repeats earlier rows (2.4).** Same root cause as S2, from the request side. Fix with S2.
- **N6 — Files table column sizing (3.1).** Carried from the design review: unsized columns default to 150px and the last column stretches. Not re-checked this round.
- **N7 — Test helpers counted in coverage (1.4, for awareness).** `src/__mocks__/viewModelWrapper.tsx` is 38% line-covered and counts toward the total. The gate allows only `*.test.*`, `*.d.ts` and `main.tsx` as excludes, so this is left as is. The file is also camelCase `.tsx` with no component, which the `code-quality` naming table would name differently; the repo's own convention is kept here.

## Changes since round 2

Verified present in code:
- Error boundaries: app-level (`src/App.tsx:93,105`) and per section (`AssetWorkspace.tsx:31,39,55,60`).
- Concurrency cap: `createTaskRunner(4)` shared across services (`createAppDeps.ts:16,21`).
- Server-side activity sort and capped paging (`RelatedDataService.ts:75-90`, `useActivitiesViewModel.ts:9-11`).
- Files paging by cursor (`useFilesViewModel.ts:30`).
- Tests for the new modules: 339 passing across 37 files.

Still open from round 2: the vitest 4.1.11 patch (N2).

## Limits of this review

- **Partial file reads.** The inventory covers all 47 `src/` files. Each one was checked by the hunt searches and the coverage report. Only the files marked "read" in `review-files.md` were opened in full for this round. A fuller read may find more Nice items, though nothing that would move a score to 1–2 was seen in the searched code.
- **Runtime behaviour not exercised.** The 429 and throttling behaviour (2.5) is judged from code, not from a live CDF project. Activity sort performance without an index (2.3) is judged from the request sizes, not measured.
- **Not in this review.** Accessibility and visual design are for `flows-design-review`, not this review.

## Summary

- Must Fix open: 0
- Should Fix open: 3
- Nice Fix open: 7
