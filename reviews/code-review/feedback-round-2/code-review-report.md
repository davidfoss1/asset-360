# Asset 360 — Flows code review

This document is the platform review for Asset 360, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix item(s)** that block approval. All four must-fix items from round 1 are resolved. The Should Fix and Nice Fix items below do not block approval.

### Reviewed commit
`700c193897e38645d6a550a3bd3b5d0f3f79f86e`

## Checks performed

- Pulled `flows-review-checks` and `code-quality` from `cognitedata/builder-skills` with `npx @cognite/cli@latest apps skills pull` before scoring. `code-quality` fix steps were not applied and no app code was edited.
- Every hunt in `flows-review-checks` Step 1 was run, including the `code-quality` searches and an extra unused-exports check. Results are in `review-findings.md`.
- Every `.ts`/`.tsx` file and the config files are inventoried in `review-files.md`. Every non-trivial production file was read.
- `npm outdated` and `npm audit` were run (`review-packages.md`).
- `npx vitest run --coverage`: 28 test files, 193 tests, 0 failures, 0 skipped.
- `npm run lint` and `npx tsc --noEmit` both exit 0.

## Round 1 follow-up

| Round 1 Must Fix | Status |
| ---------------- | ------ |
| 1. Coverage config excluded `src/cognite-file-viewer/**` | Resolved: viewer deleted, no production path is excluded |
| 2. Unused `src/lib/utils.ts` | Resolved: deleted, with `clsx` and `tailwind-merge` |
| 3. Lint errors hidden by an ESLint ignore | Resolved: viewer and the ignore removed, lint is clean with nothing skipped |
| 4. `react-pdf` two majors behind | Resolved: dependency removed |

Also closed from the Should Fix list: 30 s polling (removed, manual Refresh only) and the untested `FilePreview.tsx` (now tested, 100% lines).

## Coverage scope

Config read from `vitest.config.ts`. `coverage.include` is `src/**/*.{ts,tsx}`. `coverage.exclude` is `*.test.*`, `*.d.ts`, `src/main.tsx`, all on the allowed list. No production file is excluded, so the printed figure is the gate figure.

| Scope | Lines | Statements | Branches | Functions |
| ----- | ----- | ---------- | -------- | --------- |
| Gate scope (all of `src/` except tests, `*.d.ts`, `main.tsx`) | **95.78%** (318/332) | 94.93% | 91.17% | 92.26% |

The hard gate is 80% line coverage; this passes. Lowest files: `TimeSeriesChart.tsx` 50% (no test file), `TimeSeriesSection.tsx` 75%, and the test-support file `src/__mocks__/viewModelWrapper.tsx` 38%.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 3/5 | Every section has loading, empty and error states with retry (`SectionState`), effects clean up (`App.tsx:64`, `AssetSearch.tsx:36`), and a failed refresh keeps the last good chart. No ErrorBoundary anywhere, so a render error blanks the app. |
| User & customer | 1.3 Packages | 3/5 | Lockfile present, 0 high/critical CVEs, nothing deprecated, no production dependency two majors behind (`react-pdf` is gone). Moderate dev-only `vitest` advisory with a patch fix, and `react`, `@tanstack/react-table` and `@cognite/aura` are one major behind (pinned by Aura's peer ranges). |
| User & customer | 1.4 Tests & coverage | 4/5 | Honest 95.78% line coverage at full scope, 193 tests, nothing excluded but the allowed files. Gaps in secondary modules: `TimeSeriesChart.tsx` has no test file, and the combobox handler in `TimeSeriesSection.tsx:32` is untested. |
| User & customer | 1.5 Dead code | 4/5 | Lint and `tsc` clean, no `any`, no `console.log`, no unused files, no commented-out code. Minor cruft: dead export `readInstanceRefList` (`src/lib/properties.ts:32`) and instance-ref comparison repeated in six places. |
| User & customer | 1.6 Patterns & testability | 5/5 | DI by context (`AppDepsContext`, `AppStateContext`), interface-based services behind factories, a ViewModel hook for every section, typed mocks, no `vi.mock`, no `new CogniteClient` outside tests. |
| Cognite services | 2.1 DMS query patterns | 4/5 | `instances.search` for asset search, `retrieve` for ids, `list` with a server-side `containsAny` filter for the three related lists. Those could be one `instances.query`. |
| Cognite services | 2.2 Server-side filter | 3/5 | Relation filtering is server-side. Activities are sorted and trimmed client-side from the first 100 results (`RelatedDataService.ts:74-75`), and search results are AND-filtered client-side (50 rows). |
| Cognite services | 2.3 Limits & pages | 3/5 | Every read has a limit (50 / 100 / 1000) and nothing is prefetched, but there is no cursor or paging and no signal that results were truncated. |
| Cognite services | 2.4 Call rate | 4/5 | Polling is gone. Search is debounced (300 ms), React Query caches for 5 min, and chart/file URL fetches happen only on selection or an explicit Refresh. The asset header makes four separate `retrieve` calls (`AssetService.ts:54-58`) that could be batched. |
| Cognite services | 2.5 429 backoff | 3/5 | No `QueuedTaskRunner` and no explicit 429 handling. TanStack Query default retries (exponential, no jitter, ignores `Retry-After`) apply. Selecting an asset fans out about 8 parallel calls. |
| Cognite services | 2.6 CDF Raw | N/A | No Raw usage. |
| Brand | 3.1 Aura | 4/5 | Aura throughout: DataGrid, Tabs, Chart, Combobox, Badge, Button, Alert, EmptyState, Skeleton, Card. Inputs and tables carry `aria-label`s. Minor ad-hoc heading/text styling, and the asset search is a Popover + Command composition because `Combobox` cannot do server-side search. |

## Must Fix

None. All four items from round 1 are resolved.

## Should Fix

1. No ErrorBoundary: a render error in any section blanks the whole app. `src/App.tsx`, `src/main.tsx` (1.1)
2. No concurrency cap and no explicit 429/`Retry-After` handling; only default react-query retries. `src/main.tsx:9`, `src/services/*` (2.5)
3. Lists silently truncate at 100 (search at 50) with no pagination or indicator. `src/services/RelatedDataService.ts:36`, `src/services/AssetService.ts:28` (2.3)
4. Activities are sorted and trimmed client-side from the first 100 results, so "most recent 25" can be wrong. `src/services/RelatedDataService.ts:74-75` (2.2)
5. Missing tests for non-trivial modules: `src/features/timeseries/TimeSeriesChart.tsx` (no test file, 50%), the combobox handler at `src/features/timeseries/TimeSeriesSection.tsx:32`, and the throw branch at `src/deps/useAppDeps.ts:7` (1.4)
6. `vitest`, `@vitest/coverage-v8` and `@vitest/ui` 4.1.10 carry a moderate advisory (dev-only); a patch bump to 4.1.11 fixes it. `package.json` (1.3)

## Nice Fix

1. Replace the three `instances.list` calls for related data with one `instances.query` using result sets. `src/services/RelatedDataService.ts:97` (2.1)
2. Batch the four `retrieve` calls behind the asset header (asset, parent, class, type). `src/services/AssetService.ts:54-58` (2.4)
3. Use Aura typography and tokens for headings and text instead of ad-hoc classes. `AssetHeader.tsx`, `AssetWorkspace.tsx`, `TimeSeriesSection.tsx`; asset search deviates from `Combobox` for a documented reason (3.1)
4. Production packages one major behind: `react`/`react-dom` 18→19, `@tanstack/react-table` 8→9, `@cognite/aura` 0.3.5→1.x (several are pinned by Aura's peer ranges). `package.json` (1.3)
5. Extract repeated instance-ref comparison into `refKey`/`sameRef` in `src/lib/properties.ts`: `TimeSeriesSection.tsx:75`, `RelatedDataService.ts:127`, `useTimeSeriesViewModel.ts:93`, `useFilesViewModel.ts:35`, `FilesSection.tsx:31`, `ActivitiesSection.tsx:28` (1.5)
6. Remove the dead export `readInstanceRefList` and its test. `src/lib/properties.ts:32` (1.5)

## Summary

- Must Fix open: 0
- Should Fix open: 6
- Nice Fix open: 6
