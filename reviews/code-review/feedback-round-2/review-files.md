# File inventory: Asset 360 (round 2)

Reviewed commit `700c193897e38645d6a550a3bd3b5d0f3f79f86e`, branch `feat/asset-360-investigation-workspace`. Every `.ts`/`.tsx` under `src/` plus the config files. `node_modules`, `dist` and `.cognite-bundles` are excluded. Every non-trivial production file was read in full this round. Barrels and generated types: none exist.

Legend: Structure = single responsibility and placement. Quality = types, naming, dead code. Patterns = DI, interface services, ViewModel. Tests = a matching `*.test.ts(x)` exists (✓) or not (✗).

## Config

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| ---- | ----- | --------- | ------- | -------- | ----- | ----- |
| `vitest.config.ts` | 19 | ✓ | ✓ | n/a | n/a | `coverage.include: src/**/*.{ts,tsx}`; `coverage.exclude`: tests, `*.d.ts`, `src/main.tsx` (all allowed). `test.exclude` is vitest defaults plus `.claude/**` and `.agents/**` (skill files, not app tests). |
| `vite.config.ts` | 28 | ✓ | ✓ | n/a | n/a | No vendored-viewer special-casing any more. |
| `eslint.config.mjs` | 96 | ✓ | ✓ | n/a | n/a | No ignore of production code. |
| `vitest.setup.ts` | 1 | ✓ | ✓ | n/a | n/a | |
| `manifest.json` | 10 | ✓ | ✓ | n/a | n/a | `img-src https://*.cognitedata.com` only. |

## Production code

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| ---- | ----- | --------- | ------- | -------- | ----- | ----- |
| `src/main.tsx` | 24 | ✓ | ✓ | n/a | n/a (allowed exception) | Creates the `QueryClient` (`staleTime`/`gcTime` only). No ErrorBoundary. |
| `src/App.tsx` | 111 | ✓ | ✓ | ✓ | ✓ | Connect effect has a cancel flag. Host and SDK injectable through props. |
| `src/config/model.ts` | 28 | ✓ | ✓ | n/a | ✓ | Only `cdf_cdm` views. |
| `src/lib/properties.ts` | 35 | ✓ | ⚠ | n/a | ✓ | `readInstanceRefList` is used only by its own test (dead export). |
| `src/lib/loadStatus.ts` | 18 | ✓ | ✓ | n/a | ✓ | |
| `src/lib/format.ts` | 12 | ✓ | ✓ | n/a | ✓ | |
| `src/services/AssetService.ts` | 107 | ✓ | ✓ | ✓ | ✓ | Interface, class and factory. `search` limit 50, local AND filter. `get` makes 1 + 3 sequential-then-parallel retrieves. |
| `src/services/RelatedDataService.ts` | 157 | ✓ | ⚠ | ✓ | ✓ | `instances.list` limit 100, no cursor. Activities sorted and sliced to 25 locally (lines 74-75). `refKey` is one of several copies of the ref-compare logic. |
| `src/services/DatapointsService.ts` | 62 | ✓ | ✓ | ✓ | ✓ | `limit: 1000`, ~300 aggregate buckets. |
| `src/services/FileDownloadService.ts` | 26 | ✓ | ✓ | ✓ | ✓ | Throws if the API returns no link. |
| `src/deps/AppDepsContext.ts` | 18 | ✓ | ✓ | ✓ | covered via consumers | Context holds the service interfaces and `openExternal`. |
| `src/deps/AppDepsProvider.tsx` | 21 | ✓ | ✓ | ✓ | covered via consumers | Partial override merged over defaults. |
| `src/deps/createAppDeps.ts` | 26 | ✓ | ✓ | ✓ | ✓ | |
| `src/deps/useAppDeps.ts` | 9 | ✓ | ✓ | ✓ | covered via consumers | Throw branch (line 7) is not exercised. |
| `src/state/appState.ts` | 50 | ✓ | ✓ | n/a | ✓ | Parsed with type guards, no casts. |
| `src/state/AppStateContext.ts` | 17 | ✓ | ✓ | ✓ | covered via consumers | |
| `src/state/AppStateProvider.tsx` | 48 | ✓ | ✓ | ✓ | ✓ | Seeds from `initialState`, pushes with `syncInternalState`; sync failure deliberately swallowed. |
| `src/state/useAppState.ts` | 9 | ✓ | ✓ | ✓ | covered via consumers | |
| `src/components/SectionState.tsx` | 51 | ✓ | ✓ | ✓ | ✓ | One loading, error (with Retry), empty treatment for every section. |
| `src/features/search/useSearchViewModel.ts` | 39 | ✓ | ✓ | ✓ | ✓ | |
| `src/features/search/AssetSearch.tsx` | 102 | ✓ | ✓ | ✓ | ✓ | Debounce effect has `clearTimeout` cleanup. |
| `src/features/asset/useAssetViewModel.ts` | 31 | ✓ | ✓ | ✓ | ✓ | |
| `src/features/asset/AssetHeader.tsx` | 31 | ✓ | ✓ | ✓ | ✓ | |
| `src/features/timeseries/useTimeSeriesViewModel.ts` | 96 | ✓ | ✓ | ✓ | ✓ | No polling. Window anchored to the latest datapoint inside `queryFn`. `pickSelected` repeats the ref compare. |
| `src/features/timeseries/TimeSeriesSection.tsx` | 77 | ✓ | ⚠ | ✓ | ✓ | `keyOf` repeats the ref key logic. Combobox `onValueChange` (lines 32-33) not covered. |
| `src/features/timeseries/TimeSeriesChart.tsx` | 41 | ✓ | ✓ | ✓ | ✗ | No test file. Axis/tooltip formatters at lines 24-32 uncovered (50% lines). |
| `src/features/timeseries/summarize.ts` | 19 | ✓ | ✓ | n/a | ✓ | |
| `src/features/activities/useActivitiesViewModel.ts` | 30 | ✓ | ✓ | ✓ | ✓ | |
| `src/features/activities/ActivitiesSection.tsx` | 34 | ✓ | ✓ | ✓ | ✓ | Aura DataGrid. |
| `src/features/files/previewKind.ts` | 14 | ✓ | ✓ | n/a | ✓ | |
| `src/features/files/useFilesViewModel.ts` | 41 | ✓ | ✓ | ✓ | ✓ | |
| `src/features/files/useFilePreviewViewModel.ts` | 41 | ✓ | ✓ | ✓ | ✓ | Signed URL cached 10 min; host error on open deliberately swallowed. |
| `src/features/files/FilePreview.tsx` | 42 | ✓ | ✓ | ✓ | ✓ | Images inline, other types open in a new tab. 100% line coverage now. |
| `src/features/files/FilesSection.tsx` | 82 | ✓ | ✓ | ✓ | ✓ | `Preview` prop injectable. |
| `src/features/workspace/AssetWorkspace.tsx` | 55 | ✓ | ✓ | ✓ | ✓ | Aura Tabs and EmptyState. |

## Test support and tests

| File | Lines | Notes |
| ---- | ----- | ----- |
| `src/__mocks__/nodes.ts`, `stubLayout.ts`, `viewModelWrapper.tsx` | 30 / 14 / 63 | Shared factories. `makeDeps` uses `assert.fail` defaults. Counted in the gate-scope figure (they are not test files), at 57.89% lines. |
| 28 `*.test.ts(x)` files | n/a | 193 tests. No `vi.mock`, no `any`, no `as unknown as`. |

Largest `.tsx` files: `src/App.tsx` 111, `src/features/search/AssetSearch.tsx` 102, `src/features/files/FilesSection.tsx` 82. None over 150 lines.
