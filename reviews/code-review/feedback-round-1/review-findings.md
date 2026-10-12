# Findings: Asset 360

Reviewed commit `cd895f15af322d7e34af14464087f78e4760b15b`, branch `feat/asset-360-investigation-workspace`. Checks pulled from `cognitedata/builder-skills` (`flows-review-checks`, `code-quality`) at the start of this run. No app code was edited.

## Config inspected
- Coverage config file(s): `vitest.config.ts` (provider `v8`, `include: ['src/**/*.{ts,tsx}']`)
- Production paths excluded from coverage: **`src/cognite-file-viewer/**`** (`vitest.config.ts:22`, 458 measurable lines, vendored from the `integrate-file-viewer` skill). Other excludes are all allowed: `*.test.*`, `*.d.ts`, `src/main.tsx`.
- Tests excluded from the test run: none (`test.exclude` is vitest's defaults plus `.claude/**` and `.agents/**`, which hold skill files, not app tests).
- Also hidden from lint: `src/cognite-file-viewer` (`eslint.config.mjs:38`). Linting it with `--no-ignore` gives 31 errors and 1 warning.

## Searches
| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | none |
| TODO / FIXME / HACK in production | none |
| `useEffect` (read for cleanup) | `src/App.tsx` (cancel flag, cleanup ✓), `src/features/search/AssetSearch.tsx` (`clearTimeout` cleanup ✓), vendored `useFileResolver.ts`, `useDocumentAnnotations.ts` (cancel-ref pattern: stale results are ignored, no cleanup return), `useViewport.ts`, `CogniteFileViewer.tsx` (mixed) |
| `useQuery`/`isLoading` in `.tsx` | `src/cognite-file-viewer/CogniteFileViewer.tsx` only; the app's own `useQuery` calls are in `.ts` ViewModels, each section handles loading/empty/error via `SectionState` |
| coverage/test exclude | `vitest.config.ts:22` excludes production code (Must Fix M1); `eslint.config.mjs:38` ignores the same folder (M3) |
| CDF Raw | none (2.6 N/A) |
| `instances.list/search/query/aggregate/retrieve` | `RelatedDataService.ts:97` (`list`), `:110` (`retrieve`); `AssetService.ts:37` (`search`), `:64` (`retrieve`); vendored `useDocumentAnnotations.ts:95` (`query`, cursor loop with limit) |
| `QueuedTaskRunner` / `cdfTaskRunner` | none |
| 429 / `Retry-After` / backoff | none in app code. TanStack Query's default retry (3 attempts, exponential backoff, no jitter) applies; `main.tsx:9-12` sets only `staleTime`/`gcTime` |
| `any` / `as any` / `<any>` / `as unknown as` | none |
| `vi.mock` | none. The grep matches only `vi.mocked(...)` (typed accessor), never a module mock |
| `createContext`/`useContext` | `src/state/AppStateContext.ts:17`, `src/state/useAppState.ts:6`, `src/deps/AppDepsContext.ts:14`, `src/deps/useAppDeps.ts:6` (DI by context ✓). No `src/hooks` or `src/contexts` dirs |
| hooks importing `../` | none (no `src/hooks`) |
| `new CogniteClient` | `src/App.test.tsx:199` only (test) |
| service classes | `CdmAssetService`, `CdmRelatedDataService`, `CdmDatapointsService`, each `implements` an interface and is built through a factory |
| pages with `useQuery`/SDK | none (no `src/pages`/`src/views`); data logic lives in `use*ViewModel` hooks under `src/features/*` |
| ViewModel hooks | `useSearchViewModel`, `useAssetViewModel`, `useTimeSeriesViewModel`, `useActivitiesViewModel`, `useFilesViewModel` |
| `console.log`/`console.debug` | none |
| routes | none (single-page app, no router) |
| lint | `npm run lint` exits 0, **but only because `src/cognite-file-viewer` is ignored** (31 errors + 1 warning when included) |
| `tsc --noEmit` | passes, 0 errors |
| components > 150 lines | `src/cognite-file-viewer/CogniteFileViewer.tsx` (480, mixes fetching, viewport state and rendering), `DocumentAnnotationOverlay.tsx` (230). Own components: largest is `App.tsx` at 111 |
| unused files | `src/lib/utils.ts` (starter `cn` helper, imported nowhere) |

## Other observations from reading the code
- **Silent truncation.** Lists are bounded (`RelatedDataService.ts:36` `LIST_LIMIT = 100`, `AssetService.ts:28` `SEARCH_LIMIT = 50`, `DatapointsService.ts:22` `POINT_LIMIT = 1000`) but have no cursor and no "more results" signal, so anything past the limit is invisible to the user.
- **Client-side ordering.** `RelatedDataService.ts:74-75` sorts and slices activities after fetching the first 100, so "most recent 25" is wrong for an asset with more than 100 activities.
- **Polling.** `useTimeSeriesViewModel.ts:66,75` refetches every 30 s while the page is visible. Each tick for a numeric series is two requests (latest, then range), and there is no backoff or stop condition when the data is not changing.
- **Fan-out.** Selecting an asset triggers about 8 parallel requests (asset + parent/class/type lookups, time series list + unit lookup, activities or files, latest + range). No concurrency cap.
- **Duplicate helper logic.** Instance-ref identity is compared in four places: `TimeSeriesSection.tsx:76` (`keyOf`), `RelatedDataService.ts` (`refKey`), `useTimeSeriesViewModel.ts:98`, `useFilesViewModel.ts:35`.
- **Coverage gaps in own code.** `FilePreview.tsx` 0%, `TimeSeriesChart.tsx` 50%, `TimeSeriesSection.tsx` 75% (combobox `onValueChange`), `useAppDeps.ts` error branch.

## Must / should / nice
- [ ] **Must** — coverage config excludes production code (`src/cognite-file-viewer/**`), so the 95% figure is not the gate figure; full scope is 38.33% — `vitest.config.ts:22` — 1.4
- [ ] **Must** — unused production file `src/lib/utils.ts` — `src/lib/utils.ts:1` — 1.5
- [ ] **Must** — lint errors hidden by an ESLint ignore (31 errors, 1 warning in the vendored viewer) and a 480-line component mixing fetch and render — `eslint.config.mjs:38`, `src/cognite-file-viewer/CogniteFileViewer.tsx` — 1.5
- [ ] **Must** — `react-pdf` 9.2.1 is 2 major versions behind (latest 11.0.0) in `dependencies` with no upgrade plan — `package.json` — 1.3
- [ ] Should — no ErrorBoundary — `src/App.tsx`, `src/main.tsx` — 1.1
- [ ] Should — no concurrency cap and no 429/`Retry-After` handling; relies on default retries — `src/main.tsx:9`, `src/services/*` — 2.5
- [ ] Should — 30 s polling issues two requests per tick forever with no backoff or stop condition — `useTimeSeriesViewModel.ts:66,75` — 2.4
- [ ] Should — lists silently truncate at 100 (search at 50) with no pagination or indicator — `RelatedDataService.ts:36`, `AssetService.ts:28` — 2.3
- [ ] Should — activities are sorted and trimmed client-side from the first 100 results — `RelatedDataService.ts:74-75` — 2.2
- [ ] Should — missing tests for non-trivial modules: `FilePreview.tsx`, `TimeSeriesChart.tsx`, combobox handler in `TimeSeriesSection.tsx:32` — 1.4
- [ ] Should — `vitest`/`@vitest/coverage-v8`/`@vitest/ui` 4.1.10 have a moderate advisory (dev-only, fixed in 4.1.11) — `package.json` — 1.3
- [ ] Nice — related lists could be one `instances.query` with result sets instead of three `instances.list` calls — `RelatedDataService.ts:97` — 2.1
- [ ] Nice — ad-hoc heading and text styling instead of Aura typography tokens/components; asset search is a Popover+Command composition rather than Aura `Combobox` (documented reason) — `AssetHeader.tsx`, `AssetWorkspace.tsx`, `TimeSeriesSection.tsx`, `AssetSearch.tsx` — 3.1
- [ ] Nice — production packages one major behind: `react`/`react-dom` 18→19, `@tanstack/react-table` 8→9, `@cognite/aura` 0.3.5→1.x — `package.json` — 1.3
- [ ] Nice — `clsx` and `tailwind-merge` are used only by the unused `src/lib/utils.ts` — `package.json` — 1.5
- [ ] Nice — repeated instance-ref comparison logic; extract `refKey`/`sameRef` into `src/lib/properties.ts` — four locations above — 1.5
