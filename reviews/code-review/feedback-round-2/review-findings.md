# Findings: Asset 360 (round 2)

Reviewed commit `700c193897e38645d6a550a3bd3b5d0f3f79f86e`, branch `feat/asset-360-investigation-workspace`, clean working tree. `flows-review-checks` and `code-quality` were pulled from `cognitedata/builder-skills` with `npx @cognite/cli@latest apps skills pull` at the start of this run. No app code was edited.

## Round 1 Must Fix items

| Round 1 item | Status | Evidence |
| ------------ | ------ | -------- |
| Coverage config excludes `src/cognite-file-viewer/**` | Resolved | The viewer is deleted; `vitest.config.ts` excludes only tests, `*.d.ts`, `src/main.tsx`. Gate-scope line coverage is 95.78%. |
| Unused `src/lib/utils.ts` | Resolved | File deleted; the unused-file loop reports nothing. |
| Lint errors hidden by an ESLint ignore, oversized viewer component | Resolved | Viewer and the `eslint.config.mjs` ignore are gone; `npm run lint` exits 0 with nothing ignored. Largest `.tsx` is 111 lines. |
| `react-pdf` two majors behind | Resolved | Dependency removed from `package.json`. |
| (Should) 30 s polling | Resolved | No `refetchInterval` or timers in the series path; manual Refresh only, covered by a test. |
| (Should) `FilePreview.tsx` untested | Resolved | New `FilePreview.test.tsx`; 100% lines. |

## Config inspected
- Coverage config file(s): `vitest.config.ts` (provider `v8`, `include: ['src/**/*.{ts,tsx}']`, `exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts', 'src/main.tsx']`). `vite.config.ts` has no `test` or `coverage` block. No jest config.
- Production paths excluded from coverage: **none**. All three excludes are on the allowed list.
- Tests excluded from the test run: none. `test.exclude` is vitest's defaults plus `.claude/**` and `.agents/**`, which hold skill files, not app tests.
- Lint ignores: none that hide production code.

## Searches
| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary / componentDidCatch | none |
| TODO / FIXME / HACK / XXX in production | none |
| `useEffect` (read for cleanup) | `src/App.tsx:64` (cancel flag + cleanup ✓), `src/features/search/AssetSearch.tsx:36` (`clearTimeout` cleanup ✓). No other effects. |
| `useQuery`/`isLoading` in `.tsx` | none. All `useQuery` calls are in `.ts` ViewModels; each section renders loading, empty and error through `SectionState`. |
| coverage/test exclude | none hiding production code |
| CDF Raw | none (2.6 N/A) |
| `instances.list/search/query/aggregate/retrieve` | `RelatedDataService.ts:97` (`list`), `:110` (`retrieve`); `AssetService.ts:37` (`search`), `:64` (`retrieve`). No `query`/`aggregate`. |
| `QueuedTaskRunner` / `cdfTaskRunner` | none |
| 429 / `Retry-After` / backoff | none in app code. TanStack Query default retries (3, exponential, no jitter) apply; `main.tsx:9-15` sets only `staleTime`/`gcTime`. |
| `any` / `as any` / `<any>` / `as unknown as` | none |
| `vi.mock` | none. The grep matches only `vi.mocked(...)` (typed accessor) in service and provider tests. |
| `createContext`/`useContext` | `src/state/AppStateContext.ts:17`, `src/state/useAppState.ts:6`, `src/deps/AppDepsContext.ts:18`, `src/deps/useAppDeps.ts:6` (DI by context ✓). No `src/hooks` or `src/contexts` dirs. |
| hooks importing `../` | none (no `src/hooks`) |
| `new CogniteClient` | `src/App.test.tsx:217`, `src/deps/createAppDeps.test.ts:8` (tests only) |
| service classes | `CdmAssetService`, `CdmRelatedDataService`, `CdmDatapointsService`, `CdmFileDownloadService`, each `implements` an interface and is built through a factory |
| pages with `useQuery`/SDK | none (no `src/pages`/`src/views`); data logic is in `use*ViewModel` hooks under `src/features/*` |
| ViewModel hooks | `useSearchViewModel`, `useAssetViewModel`, `useTimeSeriesViewModel`, `useActivitiesViewModel`, `useFilesViewModel`, `useFilePreviewViewModel` |
| `console.log`/`console.debug` | none |
| routes | none (single-page app, no router) |
| flag-bag types (`loading?`, `isLoading…isError`) | none; status is the `LoadStatus` union (`src/lib/loadStatus.ts`) |
| lint | `npm run lint` exits 0, nothing ignored |
| `tsc --noEmit` | passes, 0 errors |
| components > 150 lines | none. Largest: `App.tsx` 111, `AssetSearch.tsx` 102, `FilesSection.tsx` 82. |
| unused files | none |
| unused exports (extra check) | `readInstanceRefList` (`src/lib/properties.ts:32`) is referenced only by its own test. Other exports are used in-file or are types. |

## Other observations from reading the code
- **Silent truncation.** `RelatedDataService.ts:36` `LIST_LIMIT = 100`, `AssetService.ts:28` `SEARCH_LIMIT = 50`, `DatapointsService.ts:22` `POINT_LIMIT = 1000`. None has a cursor or a "more results" signal, so anything past the limit is invisible.
- **Client-side ordering.** `RelatedDataService.ts:74-75` sorts and slices activities after fetching the first 100, so "most recent 25" is wrong for an asset with more than 100 activities.
- **Fan-out.** Selecting an asset fires about 8 requests: asset, then parent/class/type (`AssetService.ts:54-58`), time series list plus unit lookup, activities or files, and latest plus range for the chart. No concurrency cap. The three name lookups are separate `retrieve` calls.
- **No polling.** `useTimeSeriesViewModel.ts` has no `refetchInterval`; refetches happen on selection or on the Refresh button. Search is debounced at 300 ms (`AssetSearch.tsx:38`); results are cached 5 min (`main.tsx:12`).
- **Duplicate helper logic.** Instance-ref identity is compared in six places: `TimeSeriesSection.tsx:75` (`keyOf`), `RelatedDataService.ts:127` (`refKey`), `useTimeSeriesViewModel.ts:93`, `useFilesViewModel.ts:35`, `FilesSection.tsx:31` and `ActivitiesSection.tsx:28` (row ids).
- **Coverage gaps in own code.** `TimeSeriesChart.tsx` 50% (no test file), `TimeSeriesSection.tsx` 75% (combobox handler), `useAppDeps.ts` error branch. `src/__mocks__/viewModelWrapper.tsx` is 38% because several helpers are only used by some tests; it is test support, not shipped code, but it is inside the gate scope.

## Must / should / nice
- [x] **Must** — none open. All four round 1 Must Fix items are resolved (see table above).
- [ ] Should — no ErrorBoundary; a render error in any section blanks the app — `src/App.tsx`, `src/main.tsx` — 1.1
- [ ] Should — no concurrency cap and no 429/`Retry-After` handling; relies on default retries — `src/main.tsx:9`, `src/services/*` — 2.5
- [ ] Should — lists silently truncate at 100 (search at 50) with no pagination or indicator — `RelatedDataService.ts:36`, `AssetService.ts:28` — 2.3
- [ ] Should — activities are sorted and trimmed client-side from the first 100 results — `RelatedDataService.ts:74-75` — 2.2
- [ ] Should — missing tests for non-trivial modules: `TimeSeriesChart.tsx` (no test file, 50%), combobox handler in `TimeSeriesSection.tsx:32`, `useAppDeps.ts:7` error branch — 1.4
- [ ] Should — `vitest`/`@vitest/coverage-v8`/`@vitest/ui` 4.1.10 have a moderate advisory (dev-only, fixed in 4.1.11) — `package.json` — 1.3
- [ ] Nice — related lists could be one `instances.query` with result sets instead of three `instances.list` calls — `RelatedDataService.ts:97` — 2.1
- [ ] Nice — asset detail makes four `retrieve` calls (asset, then parent, class, type); could be batched — `AssetService.ts:54-58` — 2.4
- [ ] Nice — ad-hoc heading and text styling instead of Aura typography; asset search is a Popover+Command composition rather than Aura `Combobox` (documented reason) — `AssetHeader.tsx`, `AssetWorkspace.tsx`, `TimeSeriesSection.tsx`, `AssetSearch.tsx` — 3.1
- [ ] Nice — production packages one major behind: `react`/`react-dom` 18→19, `@tanstack/react-table` 8→9, `@cognite/aura` 0.3.5→1.x (pinned by Aura peer ranges) — `package.json` — 1.3
- [ ] Nice — repeated instance-ref comparison; extract `refKey`/`sameRef` into `src/lib/properties.ts` — six locations above — 1.5
- [ ] Nice — dead export `readInstanceRefList`, used only by its own test — `src/lib/properties.ts:32` — 1.5
