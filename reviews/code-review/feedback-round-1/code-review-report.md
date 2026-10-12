# Asset 360 — Flows code review

This document is the platform review for Asset 360, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **4 must-fix item(s)** that block approval. Once the must-fix items are addressed, re-run `flows-code-review`.

### Reviewed commit
`cd895f15af322d7e34af14464087f78e4760b15b`

## Checks performed

- Pulled `flows-review-checks` and `code-quality` from `cognitedata/builder-skills` with `npx @cognite/cli@latest apps skills pull` before scoring. `code-quality` fix steps were not applied and no app code was edited.
- Every hunt in `flows-review-checks` Step 1 was run, including the `code-quality` searches. Results are in `review-findings.md`.
- Every `.ts`/`.tsx` file and the config files are inventoried in `review-files.md`. Production files were read, including the vendored file viewer's effects and queries.
- `npm outdated` and `npm audit` were run (`review-packages.md`).
- `npx vitest run --coverage`: 23 test files, 163 tests, 0 failures, 0 skipped.
- `npm run lint` and `npx tsc --noEmit` both exit 0.

## Coverage scope

Config read from `vitest.config.ts`. `coverage.include` is `src/**/*.{ts,tsx}`. `coverage.exclude` is `*.test.*`, `*.d.ts`, `src/main.tsx` (all allowed) **and `src/cognite-file-viewer/**`, which is production code and not an allowed exclusion**.

| Scope | Lines | Statements | Branches | Functions |
| ----- | ----- | ---------- | -------- | --------- |
| As configured (viewer excluded) | 95.14% (294/309) | 93.65% | 90.19% | 90.25% |
| Gate scope (all of `src/` except tests, `*.d.ts`, `main.tsx`) | **38.33%** (294/767) | 37.96% | 38.65% | 56.04% |

The printed 95% does not count, per the rules. The gate figure is 38.33%, because the vendored viewer is 458 lines at 0% coverage.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 3/5 | Every section has loading, empty and error states with retry, effects clean up (`App.tsx`, `AssetSearch.tsx`), and failed refreshes keep the last good chart. No ErrorBoundary anywhere, so a render error blanks the app. |
| User & customer | 1.3 Packages | 2/5 | Lockfile present, 0 high/critical CVEs, nothing deprecated. `react-pdf` 9.2.1 is 2 majors behind 11.0.0 in `dependencies` with no upgrade plan. Moderate dev-only `vitest` advisory. |
| User & customer | 1.4 Tests & coverage | 2/5 | 163 tests pass and cover the app's own code well, but `vitest.config.ts:22` excludes production code from coverage. Gate-scope line coverage is 38.33%. |
| User & customer | 1.5 Dead code | 2/5 | `src/lib/utils.ts` is an unused file. ESLint ignores the vendored viewer (`eslint.config.mjs:38`), which has 31 errors and 1 warning when linted, and a 480-line component mixing fetch and render. No `any` or `console.log`. |
| User & customer | 1.6 Patterns & testability | 5/5 | DI by context (`AppDepsContext`, `AppStateContext`), interface-based services behind factories, ViewModel hooks for every section, typed mocks, no `vi.mock`, no `new CogniteClient` outside tests. |
| Cognite services | 2.1 DMS query patterns | 4/5 | `instances.search` for asset search, `retrieve` for ids, `list` with a server-side `containsAny` filter for the three related lists. Those could be one `instances.query`. |
| Cognite services | 2.2 Server-side filter | 3/5 | Relation filtering is server-side. Activities are sorted and trimmed client-side from the first 100 results (`RelatedDataService.ts:74-75`), and search results are AND-filtered client-side (limited to 50 rows). |
| Cognite services | 2.3 Limits & pages | 3/5 | Every read has a limit (50 / 100 / 1000) and nothing is prefetched, but there is no cursor or paging and no signal that results were truncated. |
| Cognite services | 2.4 Call rate | 3/5 | Search is debounced (300 ms) and react-query caches. Polling every 30 s sends two requests per tick with no backoff or stop condition, even for static data. |
| Cognite services | 2.5 429 backoff | 3/5 | No `QueuedTaskRunner` and no explicit 429 handling. TanStack Query default retries (exponential, no jitter, ignores `Retry-After`) apply. Selecting an asset fans out about 8 parallel calls. |
| Cognite services | 2.6 CDF Raw | N/A | No Raw usage. |
| Brand | 3.1 Aura | 4/5 | Aura throughout: DataGrid, Tabs, Chart, Combobox, Badge, Button, Alert, EmptyState, Skeleton, Card. Minor ad-hoc heading/text styling, and the asset search is a Popover + Command composition because `Combobox` cannot do server-side search. |

## Must Fix

1. **Coverage config excludes production code.** `vitest.config.ts:22` excludes `src/cognite-file-viewer/**`, so the reported 95% is not the gate number; at gate scope line coverage is 38.33%. Criterion 1.4.
   _Impact:_ the file preview, the way analysts open manuals and P&IDs, has no automated verification, and the headline coverage figure overstates how much of the app is tested.
2. **Unused production file.** `src/lib/utils.ts` (the starter `cn` helper) is imported nowhere. Criterion 1.5.
   _Impact:_ dead code that reviewers and future maintainers must read and keep compiling, along with its two otherwise unused dependencies.
3. **Lint errors hidden by an ignore, in an oversized component.** `eslint.config.mjs:38` ignores `src/cognite-file-viewer`. Linted with `--no-ignore` it has 31 errors and 1 warning (for example `react-hooks/refs` writes during render in `useViewport.ts:80-82`), and `CogniteFileViewer.tsx` is 480 lines mixing data fetching, viewport state and rendering. Criterion 1.5.
   _Impact:_ the lint gate is green only because the code is skipped, and render-time ref writes can show stale zoom or pan state when an analyst is reading a diagram.
4. **Production dependency two majors behind.** `react-pdf` 9.2.1 against latest 11.0.0, in `dependencies`, with no documented upgrade plan. Criterion 1.3.
   _Impact:_ missing upstream fixes in the PDF rendering path, which opens documents users did not author.

## Should Fix

1. No ErrorBoundary: a render error in any section blanks the whole app. `src/App.tsx`, `src/main.tsx` (1.1)
2. No concurrency cap and no explicit 429/`Retry-After` handling; only default react-query retries. `src/main.tsx:9`, `src/services/*` (2.5)
3. 30 s polling sends two requests per tick indefinitely, even when the series has not changed. `src/features/timeseries/useTimeSeriesViewModel.ts:66,75` (2.4)
4. Lists silently truncate at 100 (search at 50) with no pagination or indicator. `src/services/RelatedDataService.ts:36`, `src/services/AssetService.ts:28` (2.3)
5. Activities are sorted and trimmed client-side from the first 100 results, so "most recent 25" can be wrong. `src/services/RelatedDataService.ts:74-75` (2.2)
6. Missing tests for non-trivial modules: `src/features/files/FilePreview.tsx` (0%), `src/features/timeseries/TimeSeriesChart.tsx` (50%), the combobox handler at `src/features/timeseries/TimeSeriesSection.tsx:32` (1.4)
7. `vitest`, `@vitest/coverage-v8` and `@vitest/ui` 4.1.10 carry a moderate advisory (dev-only); patch bump to 4.1.11 fixes it. `package.json` (1.3)

## Nice Fix

1. Replace the three `instances.list` calls for related data with one `instances.query` using result sets. `src/services/RelatedDataService.ts:97` (2.1)
2. Use Aura typography and tokens for headings and text instead of ad-hoc classes. `AssetHeader.tsx`, `AssetWorkspace.tsx`, `TimeSeriesSection.tsx`; asset search deviates from `Combobox` for a documented reason (3.1)
3. Production packages one major behind: `react`/`react-dom` 18→19, `@tanstack/react-table` 8→9, `@cognite/aura` 0.3.5→1.x (several are pinned by Aura's peer ranges). `package.json` (1.3)
4. Remove `clsx` and `tailwind-merge` once `utils.ts` is deleted. `package.json` (1.5)
5. Extract repeated instance-ref comparison into `refKey`/`sameRef` in `src/lib/properties.ts`: `TimeSeriesSection.tsx:76`, `RelatedDataService.ts`, `useTimeSeriesViewModel.ts:98`, `useFilesViewModel.ts:35` (1.5)

## Summary

- Must Fix open: 4
- Should Fix open: 7
- Nice Fix open: 5
