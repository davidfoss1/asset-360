# Findings: Asset 360, round 3

Reviewed commit `3c89a3ada1512b7525b1b568d550995fc2bb200f`.

## Config inspected

- Coverage config file(s): `vitest.config.ts` (`coverage.include: ['src/**/*.{ts,tsx}']`, `coverage.exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts', 'src/main.tsx']`). `vite.config.ts` has no `test` block beyond what `vitest.config.ts` sets. No `jest.config.*`.
- Production paths excluded from coverage: none beyond the allowed set (`*.test.*`, `*.d.ts`, `src/main.tsx`). `src/__mocks__/*` is not excluded, so its helpers count toward coverage.
- Tests excluded from the test run: none of the app's tests. `test.exclude` adds `.claude/**` and `.agents/**`, which hold skill files, not app tests.
- Test run: 37 files, 339 tests, all passing.
- Coverage: statements 97.98% (534/545), branches 94.73% (360/380), functions 96.44% (217/225), lines 98.31% (467/475).

Note: this repo has no `src/hooks/`, `src/pages/` or `src/views/`. The feature folders (`src/features/*`) play those roles, so the hunts that name those folders were run against `src/` and against `src/features/`.

## Searches

| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | `src/App.tsx:93,105` (app-level, last resort); `src/features/workspace/AssetWorkspace.tsx:31,39,55,60` (one per section); class at `src/components/ErrorBoundary.tsx:18` with `getDerivedStateFromError` |
| TODO / FIXME / HACK / XXX | none |
| useEffect (cleanup check) | `src/App.tsx:65-78` (cancel flag, cleaned up); `src/features/search/AssetSearch.tsx:36-40` (timer cleared); `src/lib/useElementWidth.ts:11-20` (observer disconnected). All three have cleanup. |
| useQuery / useInfiniteQuery | `src/features/asset/useAssetViewModel.ts:19`; `src/features/search/useSearchViewModel.ts:26`; `src/features/timeseries/useTimeSeriesViewModel.ts:45,58`; `src/features/files/useFilesViewModel.ts:30` (infinite); `src/features/files/useFilePreviewViewModel.ts:23`; `src/features/activities/useActivitiesViewModel.ts:36` (infinite). Each feeds a loading, error and empty state through `SectionState` or the search status. |
| CDF Raw (`client.raw`, `listRows`, `insertRows`, `retrieveRow`) | none (2.6 N/A) |
| instances.list / query / search / retrieve / aggregate | `instances.list`: `src/services/RelatedDataService.ts:130` (activities, files, time series, all with a limit or cursor). `instances.retrieve`: `src/services/RelatedDataService.ts:147`, `src/services/AssetService.ts:81`. `instances.search`: `src/services/AssetService.ts:45`. No `instances.query` or `aggregate`. |
| QueuedTaskRunner / cdfTaskRunner / concurrency cap | `src/lib/taskRunner.ts:5` (`createTaskRunner`, a queue with a cap); `src/deps/createAppDeps.ts:16` (`MAX_CONCURRENT_REQUESTS = 4`), `:21` (one shared runner for all services). Services call through it: `src/services/*.ts` (`this.run(...)`). |
| 429 / Retry-After / exponential / backoff | none. The only retries are TanStack Query's defaults (`src/main.tsx:9-15` sets `staleTime` and `gcTime` only, so the default `retry: 3` with exponential delay applies to queries). |
| `any` / `as any` / `<any>` / `as unknown as` | none in production or test code |
| `vi.mock(` | none (the only matches are `vi.mocked(`, which is a typed accessor on injected fakes) |
| lint | `npm run lint` (eslint over `.js/.mjs/.cjs/.ts/.tsx`): no output, no errors or warnings |
| tsc | `npx tsc --noEmit`: no output, no errors |
| CogniteClient construction | outside tests: none in `src/`. Only in `src/App.test.tsx:217` (factory injected as `createClient`) and `src/deps/createAppDeps.test.ts:8`. Production construction goes through the injected `createClient` in `createAppDeps`. |
| DI / ViewModel | view models read dependencies from context via `useAppDeps()` (`useTimeSeriesViewModel.ts:41`, `useAssetViewModel.ts:15`, `useFilesViewModel.ts:26`, `useSearchViewModel.ts:22`, `useFilePreviewViewModel.ts:21`, `useActivitiesViewModel.ts:29`). No view model imports a service value. Service imports are type-only (`import type`). |
| service classes implement interfaces | `CdmAssetService` (`src/services/AssetService.ts:34`), `CdmRelatedDataService` (`RelatedDataService.ts:52`), `CdmDatapointsService` (`DatapointsService.ts:25`), `CdmFileDownloadService` (`FileDownloadService.ts:14`). Each `implements` an exported interface. |
| unused production files | none (every production file's basename is referenced elsewhere) |
| console.log / console.debug | none. No `console.*` at all in production `src/`. |
| routes (`path:` / `<Route`) | none. One screen, no router. |
| components > 150 lines (`.tsx`) | none. Largest: `src/features/search/AssetSearch.tsx` 116, `src/App.tsx` 115, `src/features/timeseries/TimeSeriesSection.tsx` 107. |
| naming | `src/__mocks__/viewModelWrapper.tsx`: a `.tsx` file with no component (camelCase). Repo convention is PascalCase for components and camelCase for modules; the `code-quality` table asks for kebab-case. Not scored, see Nice N7. |

## Must / should / nice

### Must Fix

None.

Checked against the must-fix bar: no criterion scores 1–2; no lint or `tsc` errors; no production `any`; coverage 98.31% lines over the full `src/` scope with no hidden production or test files; no high or critical CVEs; no unbounded API reads (activities capped at 500, time series at 1000 nodes, search at 50, files cursor-paged); no unreachable pages; no CDF Raw.

### Should Fix (score 3)

- [ ] **S1 — Outdated production dependencies, no upgrade plan.** `package.json`: `@cognite/aura` `^0.3.5` (latest `1.46571.0`, one major), `react` / `react-dom` `^18.3.1` (latest `19.3.0`, one major), `@tanstack/react-table` `^8.21.3` (latest `9.2.8`, one major), `@cognite/app-sdk` `^0.9.0` (latest `0.11.0`, two minors on a `0.x` line). Criterion 1.3. Health: Warn. Details in `review-packages.md`.
- [ ] **S2 — Activities "Load more" re-downloads the whole list each time.** `src/features/activities/useActivitiesViewModel.ts:39-43`: each page asks for `limit` rows, where `limit` grows by 25 up to `ACTIVITY_MAX = 500` (`:9-11`). Each request resends every row already shown. Reaching 500 activities takes 20 requests and downloads about 5,250 rows in total (25 + 50 + … + 500). `maxPages: 1` keeps the cache from growing but does not stop the refetch. The growing limit is the price of server-side sorting without a DMS index (the user confirmed there are no indexes), so a cursor cannot be used here. Criterion 2.3 (occasional high limits or redundant page fetches). Related to Nice N5.
- [ ] **S3 — No 429 or Retry-After handling.** `src/lib/taskRunner.ts` caps concurrency at 4 (`src/deps/createAppDeps.ts:16,21`), which is the cap half of 2.5. Nothing reads a 429 response or `Retry-After`; the only retry is TanStack Query's default (3 attempts, exponential, no jitter), which does not know about throttling. Criterion 2.5 (missing handling for throttling).

### Nice to Fix (score 4)

- [ ] **N1 — Stale-state update can drop a patch.** `src/state/AppStateProvider.tsx:25-33`: `update` builds `next` from `state` as it was at the last render, so two `update` calls in the same event lose the first patch. `selectAsset` avoids this by clearing its fields in one call, so no current path hits it. Criterion 1.1. Surfaced in the design-review session as a smell.
- [ ] **N2 — Vitest moderate advisory, patch fix available.** `vitest` `4.1.10` in devDependencies has a moderate advisory (also `@vitest/coverage-v8`, `@vitest/mocker`, `@vitest/ui`); fixed in `4.1.11`. Dev tooling only. Criterion 1.3. Same change as the open vitest item from round 2.
- [ ] **N3 — Time series listing could be one query.** `src/services/RelatedDataService.ts:58-80`: lists series by cursor, then fetches units in a separate batched lookup. A single `instances.query` with a join might fetch both. Criterion 2.1 (one or two calls could move to query).
- [ ] **N4 — Time series walk up to 1000 nodes per asset.** `src/services/RelatedDataService.ts:49,108-116`: the walk follows cursors until there are no more or 1000 nodes. Typical assets have a handful of series, so the cost is small, but the cap is silent (no message when hit). Criterion 2.2 (minor over-fetch). Also design-review Nice item on caps.
- [ ] **N5 — Load more re-requests rows already on screen.** Same cause as S2, seen from the request side: each page repeats every earlier row. Criterion 2.4 (a hot path could batch or avoid repeats). Fix together with S2.
- [ ] **N6 — Files table uses default column sizing.** Carried from the design review (TanStack's default 150px for unsized columns, so the last column stretches). Not re-checked in this round's hunt; the search above does not cover table column sizing. Criterion 3.1. Also a design-review Nice item.
- [ ] **N7 — Test helpers live in `src/__mocks__/` and count toward coverage.** `src/__mocks__/viewModelWrapper.tsx` is 38% line-covered and pulls the measured total down (its lines are part of the 475 measured). The coverage gate allows only `*.test.*`, `*.d.ts` and `main.tsx`, so moving the helpers out of `src/` would need a config change, and this review does not recommend one. Also: `viewModelWrapper.tsx` is camelCase `.tsx` with no component, which the `code-quality` table would name differently. Not scored; for awareness.

## Summary counts

- Must Fix: 0
- Should Fix: 3 (S1, S2, S3)
- Nice Fix: 7 (N1 to N7)
